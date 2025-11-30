/**
 * VocaVision Admin Layout
 * 관리자 대시보드 레이아웃
 */

import { Metadata } from 'next';
import { Inter, Noto_Sans_KR } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-noto-sans-kr',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VocaVision Admin',
  description: 'VocaVision 관리자 대시보드',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} ${notoSansKr.variable} font-sans`}>
      {children}
    </div>
  );
}
