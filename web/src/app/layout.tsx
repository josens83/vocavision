import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { OfflineBannerWrapper } from '@/components/errors/OfflineBannerWrapper';
import Providers from '@/components/providers/Providers';
import { Footer } from '@/components/Footer';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import StudyFAB from '@/components/ui/StudyFAB';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import ScrollToTop from '@/components/ui/ScrollToTop';

const siteUrl = 'https://vocavision.kr';
const siteName = 'VocaVision';

export const metadata: Metadata = {
  // 기본 정보
  title: {
    default: 'VocaVision - AI 기반 영어 단어 학습 플랫폼',
    template: '%s | VocaVision',
  },
  description: '수능, TEPS, TOEFL 영어 단어를 이미지 연상법, 어원 분석, Rhyme으로 효과적으로 암기하세요. 3,000개+ 단어 무료 제공.',

  // 검색 엔진
  keywords: [
    '영어 단어 암기',
    '수능 영단어',
    'TEPS 단어',
    'TOEFL 단어',
    '영어 어휘',
    '단어 암기법',
    '연상법 영어',
    '어원 학습',
    'AI 영어 학습',
    'VocaVision',
  ],

  // 저자 정보
  authors: [{ name: 'VocaVision', url: siteUrl }],
  creator: 'Unipath',
  publisher: 'Unipath',

  // 로봇 설정
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Open Graph (소셜 공유)
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: siteName,
    title: 'VocaVision - AI 기반 영어 단어 학습 플랫폼',
    description: '수능, TEPS 필수 영단어를 AI 이미지와 함께 학습하세요.',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'VocaVision - AI 기반 영어 단어 학습 플랫폼',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'VocaVision - AI 기반 영어 단어 학습 플랫폼',
    description: '수능, TEPS 필수 영단어를 AI 이미지와 함께 학습하세요.',
    images: [`${siteUrl}/og-image.jpg`],
  },

  // 추가 메타
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },

  // 앱 정보
  applicationName: 'VocaVision',
  category: 'education',

  // 검증 (나중에 추가)
  // verification: {
  //   google: 'google-site-verification-code',
  //   naver: 'naver-site-verification-code',
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="ko">
      <head>
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <GoogleAnalytics />
          <OfflineBannerWrapper />
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 pb-16 md:pb-0">
              {children}
            </main>
            <Footer />
          </div>
          <StudyFAB />
          <BottomTabBar />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
