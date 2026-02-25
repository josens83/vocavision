import { Metadata } from 'next';
import WordDetailClient from './WordDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// 서버에서 기본 단어 정보만 가져오기
async function getWordBasic(id: string) {
  try {
    const res = await fetch(`${API_URL}/words/${id}`, {
      next: { revalidate: 86400 }, // 24시간 ISR
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.word || data;
  } catch {
    return null;
  }
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const word = await getWordBasic(id);

  if (!word) {
    return { title: 'VocaVision AI - 단어를 찾을 수 없습니다' };
  }

  const title = `${word.word} 뜻 — ${word.definitionKo || word.definition} | VocaVision AI`;
  const description = `${word.word} (${word.partOfSpeech || ''}): ${word.definitionKo || word.definition}. 발음: ${word.pronunciation || ''}. AI 이미지, 어원, 암기법, 라임으로 완벽 암기.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://vocavision.kr/words/${id}`,
    },
  };
}

export default async function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wordBasic = await getWordBasic(id);

  return (
    <>
      {/* SEO용 서버 렌더링 HTML — Googlebot이 읽을 수 있음 */}
      {wordBasic && (
        <div className="sr-only" aria-hidden="false">
          <h1>{wordBasic.word} — {wordBasic.definitionKo || wordBasic.definition}</h1>
          <p>품사: {wordBasic.partOfSpeech}</p>
          <p>발음: {wordBasic.pronunciation}</p>
          {wordBasic.ipaUs && <p>IPA: {wordBasic.ipaUs}</p>}
        </div>
      )}

      {/* 기존 클라이언트 컴포넌트 */}
      <WordDetailClient id={id} initialWord={wordBasic} />
    </>
  );
}
