import type { Metadata } from 'next';
import './globals.css';
import { RootErrorBoundaryWrapper } from '@/components/errors/RootErrorBoundaryWrapper';

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
        <RootErrorBoundaryWrapper>
          {children}
        </RootErrorBoundaryWrapper>
      </body>
    </html>
  );
}
