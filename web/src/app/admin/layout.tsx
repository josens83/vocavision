/**
 * VocaVision Admin Layout
 * 관리자 대시보드 레이아웃
 */

import { Metadata } from 'next';

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
    <div className="font-sans">
      {children}
    </div>
  );
}
