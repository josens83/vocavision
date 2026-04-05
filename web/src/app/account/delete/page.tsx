import { Metadata } from 'next';
import { headers } from 'next/headers';
import AccountDeleteContent from './AccountDeleteContent';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isEn = host.includes('vocavision.app');

  return {
    title: isEn ? 'Delete Account — VocaVision AI' : '계정 삭제 요청 - VocaVision AI',
    description: isEn
      ? 'How to request deletion of your VocaVision AI account and all associated data.'
      : 'VocaVision AI 계정 및 관련 데이터 삭제를 요청하는 방법을 안내합니다.',
  };
}

export default function AccountDeletePage() {
  return <AccountDeleteContent />;
}
