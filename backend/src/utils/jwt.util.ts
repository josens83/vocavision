import jwt, { SignOptions } from 'jsonwebtoken';

export const generateToken = (userId: string, role: string): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
  };

  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    options
  );
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};
