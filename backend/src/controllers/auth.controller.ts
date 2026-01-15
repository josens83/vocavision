import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';
import { AppError } from '../middleware/error.middleware';

// Kakao OAuth 설정
const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

// Google OAuth 설정
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// 카카오 API 응답 타입 정의
interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
}

interface KakaoUserResponse {
  id: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
  kakao_account?: {
    email?: string;
  };
}

// Google API 응답 타입 정의
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

interface GoogleUserResponse {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('[Register] Request received:', { email: req.body.email, name: req.body.name });

    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    // Check database connection first
    console.log('[Register] Checking database connection...');
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[Register] Database connection OK');
    } catch (dbError) {
      console.error('[Register] Database connection failed:', dbError);
      throw new AppError('Database connection failed. Please try again later.', 503);
    }

    // Check if user exists
    console.log('[Register] Checking for existing user...');
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Create user with trial subscription
    console.log('[Register] Creating user...');
    const hashedPassword = await hashPassword(password);
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7); // 7-day trial

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        subscriptionStatus: 'TRIAL',
        trialEnd
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionStatus: true,
        trialEnd: true
      }
    });

    console.log('[Register] User created:', user.id);

    // Check JWT_SECRET before generating token
    if (!process.env.JWT_SECRET) {
      console.error('[Register] JWT_SECRET is not set!');
      throw new AppError('Server configuration error', 500);
    }

    const token = generateToken(user.id, user.role);
    console.log('[Register] Token generated successfully');

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('[Register] Error:', error);
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password || '');

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last active date
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveDate: new Date() }
    });

    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEnd: true,
        trialEnd: true,
        totalWordsLearned: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * 카카오 로그인 처리
 */
export const kakaoLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.body;

    if (!code) {
      throw new AppError('인가 코드가 필요합니다', 400);
    }

    if (!KAKAO_CLIENT_ID || !KAKAO_CLIENT_SECRET || !KAKAO_REDIRECT_URI) {
      console.error('[KakaoLogin] Missing environment variables');
      throw new AppError('카카오 로그인 설정이 완료되지 않았습니다', 500);
    }

    // 1. 카카오 토큰 발급
    console.log('[KakaoLogin] Requesting token from Kakao...');
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID,
        client_secret: KAKAO_CLIENT_SECRET,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('[KakaoLogin] Token error:', errorData);
      throw new AppError('카카오 토큰 발급 실패', 400);
    }

    const tokenData = (await tokenResponse.json()) as KakaoTokenResponse;
    const { access_token } = tokenData;

    // 2. 카카오 사용자 정보 조회
    console.log('[KakaoLogin] Fetching user info from Kakao...');
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new AppError('카카오 사용자 정보 조회 실패', 400);
    }

    const kakaoUser = (await userResponse.json()) as KakaoUserResponse;
    const kakaoId = String(kakaoUser.id);
    const nickname = kakaoUser.properties?.nickname || '사용자';
    const profileImage = kakaoUser.properties?.profile_image || null;
    const email = kakaoUser.kakao_account?.email || null;

    console.log('[KakaoLogin] Kakao user:', { kakaoId, nickname, email });

    // 3. 기존 사용자 확인 또는 새 사용자 생성
    let user = await prisma.user.findUnique({
      where: { kakaoId },
    });

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7); // 7-day trial

    if (!user) {
      // 새 사용자 생성
      user = await prisma.user.create({
        data: {
          kakaoId,
          name: nickname,
          avatar: profileImage,
          email,
          provider: 'kakao',
          subscriptionStatus: 'TRIAL',
          trialEnd,
        },
      });
      console.log('[KakaoLogin] New user created:', user.id);
    } else {
      // 기존 사용자 정보 업데이트
      user = await prisma.user.update({
        where: { kakaoId },
        data: {
          name: nickname,
          avatar: profileImage,
          lastActiveDate: new Date(),
          // 기존에 이메일이 없고 새로 받아온 이메일이 있으면 업데이트
          ...((!user.email && email) ? { email } : {}),
        },
      });
      console.log('[KakaoLogin] Existing user logged in:', user.id);
    }

    // 4. JWT 토큰 발급
    const token = generateToken(user.id, user.role);

    // 5. 응답
    res.json({
      success: true,
      message: '카카오 로그인 성공',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        provider: user.provider,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error('[KakaoLogin] Error:', error);
    next(error);
  }
};

// ============================================
// Google OAuth Login
// ============================================

export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.body;

    if (!code) {
      throw new AppError('인가 코드가 필요합니다', 400);
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      console.error('[GoogleLogin] Missing environment variables:', {
        hasClientId: !!GOOGLE_CLIENT_ID,
        hasClientSecret: !!GOOGLE_CLIENT_SECRET,
        hasRedirectUri: !!GOOGLE_REDIRECT_URI,
      });
      throw new AppError('구글 로그인 설정이 완료되지 않았습니다', 500);
    }

    // 1. Google 토큰 발급
    console.log('[GoogleLogin] Requesting token from Google...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('[GoogleLogin] Token error:', errorData);
      throw new AppError('구글 토큰 발급 실패', 400);
    }

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
    const { access_token } = tokenData;

    // 2. Google 사용자 정보 조회
    console.log('[GoogleLogin] Fetching user info from Google...');
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new AppError('구글 사용자 정보 조회 실패', 400);
    }

    const googleUser = (await userResponse.json()) as GoogleUserResponse;
    const googleId = googleUser.id;
    const name = googleUser.name || '사용자';
    const email = googleUser.email;
    const picture = googleUser.picture || null;

    console.log('[GoogleLogin] Google user:', { googleId, name, email });

    // 3. 기존 사용자 확인 또는 새 사용자 생성
    let user = await prisma.user.findUnique({
      where: { googleId },
    });

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7); // 7-day trial

    if (!user) {
      // 이메일로 기존 사용자 확인 (다른 방법으로 가입한 경우)
      const existingUserByEmail = email ? await prisma.user.findUnique({
        where: { email },
      }) : null;

      if (existingUserByEmail) {
        // 기존 이메일 사용자에 Google ID 연결
        user = await prisma.user.update({
          where: { email },
          data: {
            googleId,
            avatar: existingUserByEmail.avatar || picture,
            lastActiveDate: new Date(),
          },
        });
        console.log('[GoogleLogin] Linked Google to existing email user:', user.id);
      } else {
        // 새 사용자 생성
        user = await prisma.user.create({
          data: {
            googleId,
            name,
            avatar: picture,
            email,
            provider: 'google',
            subscriptionStatus: 'TRIAL',
            trialEnd,
          },
        });
        console.log('[GoogleLogin] New user created:', user.id);
      }
    } else {
      // 기존 사용자 정보 업데이트
      user = await prisma.user.update({
        where: { googleId },
        data: {
          name,
          avatar: picture,
          lastActiveDate: new Date(),
          // 기존에 이메일이 없고 새로 받아온 이메일이 있으면 업데이트
          ...((!user.email && email) ? { email } : {}),
        },
      });
      console.log('[GoogleLogin] Existing user logged in:', user.id);
    }

    // 4. JWT 토큰 발급
    const token = generateToken(user.id, user.role);

    // 5. 응답
    res.json({
      success: true,
      message: '구글 로그인 성공',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        provider: user.provider,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error('[GoogleLogin] Error:', error);
    next(error);
  }
};
