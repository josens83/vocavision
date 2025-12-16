import type { Metadata } from 'next';
import './globals.css';
import { OfflineBannerWrapper } from '@/components/errors/OfflineBannerWrapper';
import Providers from '@/components/providers/Providers';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'VocaVision - 영어 단어 학습 플랫폼',
  description: '이미지, 동영상, Rhyming, 연상법, 어원으로 배우는 영어 단어 학습',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <Providers>
          <OfflineBannerWrapper />
          <div className="flex flex-col min-h-screen">
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
