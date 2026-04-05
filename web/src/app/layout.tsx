import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { OfflineBannerWrapper } from '@/components/errors/OfflineBannerWrapper';
import Providers from '@/components/providers/Providers';
import { Footer } from '@/components/Footer';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import ScrollToTop from '@/components/ui/ScrollToTop';
import BackButtonHandler from '@/components/native/BackButtonHandler';
import AppIntro from '@/components/native/AppIntro';
import { getServerLocale, getSiteUrl } from '@/lib/utils/getLocale';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const siteUrl = getSiteUrl(locale);
  const isEn = locale === 'en';

  const title = isEn
    ? 'VocaVision AI - Master Vocabulary with AI Images'
    : 'VocaVision AI - AI 기반 영어 단어 학습 플랫폼';

  const description = isEn
    ? 'Master SAT, GRE, TOEFL & IELTS vocabulary with AI-generated images, etymology & rhymes. 19,000+ words. Free to start.'
    : '수능, TEPS, TOEFL 영어 단어를 AI 이미지 연상법, 어원 분석, Rhyme으로 효과적으로 암기하세요. 3,000개+ 단어 무료 제공.';

  const keywords = isEn
    ? [
        'SAT vocabulary', 'GRE vocabulary', 'TOEFL vocabulary', 'IELTS vocabulary',
        'English vocabulary app', 'AI vocabulary learning', 'spaced repetition English',
        'vocabulary flashcards', 'etymology', 'word roots', 'VocaVision AI',
        'learn english words', 'SAT prep', 'GRE prep', 'visual vocabulary',
      ]
    : [
        '영어 단어 암기', '수능 영단어', 'TEPS 단어', 'TOEFL 단어', '영어 어휘',
        '단어 암기법', '연상법 영어', '어원 학습', 'AI 영어 학습', 'VocaVision AI', '보카비전 AI',
      ];

  return {
    title: { default: title, template: '%s | VocaVision AI' },
    description,
    keywords,
    authors: [{ name: 'VocaVision AI', url: siteUrl }],
    creator: 'Unipath',
    publisher: 'Unipath',
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    manifest: '/manifest.json',
    openGraph: {
      type: 'website',
      locale: isEn ? 'en_US' : 'ko_KR',
      url: siteUrl,
      siteName: 'VocaVision AI',
      title,
      description,
      images: [{ url: `${siteUrl}/${isEn ? 'og-image-en-v3.jpg' : 'og-image-kr-v3.jpg'}`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`${siteUrl}/${isEn ? 'og-image-en-v3.jpg' : 'og-image-kr-v3.jpg'}`] },
    metadataBase: new URL(siteUrl),
    applicationName: 'VocaVision AI',
    category: 'education',
    verification: {
      google: ['KmcZnbsxKMk9XpW3_UrrtXPh-kevM3EI0ra_Trmme5Y', 'pds_cyPa4VyEPjt_KPCxcJHEUDH2mhH9De5dU01lhYQ'],
      other: { 'naver-site-verification': '6441ff858511a40b6f042e7d0d771f8026a93471' },
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang={getServerLocale() === 'en' ? 'en' : 'ko'} translate="no" className="notranslate">
      <head>
        <meta name="google" content="notranslate" />
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
        <AppIntro />
        <Providers>
          <GoogleAnalytics />
          <OfflineBannerWrapper />
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 pb-20 md:pb-0">
              {children}
            </main>
            <Footer />
          </div>
          <BottomTabBar />
          <ScrollToTop />
          <BackButtonHandler />
        </Providers>
      </body>
    </html>
  );
}
