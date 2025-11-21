import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { RootErrorBoundaryWrapper } from '@/components/errors/RootErrorBoundaryWrapper';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        <RootErrorBoundaryWrapper>
          {children}
        </RootErrorBoundaryWrapper>
      </body>
    </html>
  );
}
