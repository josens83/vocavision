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

  const titleKo = `${word.word} 뜻 — ${word.definitionKo || word.definition} | VocaVision AI`;
  const titleEn = `${word.word} - Definition, Etymology & Visual Mnemonic | VocaVision AI`;
  const descKo = `${word.word} (${word.partOfSpeech || ''}): ${word.definitionKo || word.definition}. AI 이미지, 어원, 암기법으로 완벽 암기.`;
  const descEn = `${word.word} (${word.partOfSpeech || ''}): ${word.definition}. Learn with AI visual mnemonic, etymology breakdown, and spaced repetition. Perfect for SAT • GRE • TOEFL • IELTS.`;

  return {
    title: titleKo,
    description: descKo,
    openGraph: {
      title: titleKo,
      description: descKo,
      type: 'article',
      url: `https://vocavision.kr/words/${id}`,
    },
    alternates: {
      canonical: `https://vocavision.kr/words/${id}`,
      languages: {
        'ko': `https://vocavision.kr/words/${id}`,
        'en': `https://vocavision.app/words/${id}`,
      },
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
          <h1>{wordBasic.word} — {wordBasic.definition}</h1>
          <p>Part of speech: {wordBasic.partOfSpeech}</p>
          <p>Definition: {wordBasic.definition}</p>
          {wordBasic.ipaUs && <p>Pronunciation (IPA): {wordBasic.ipaUs}</p>}
          {wordBasic.definitionKo && <p>Korean meaning: {wordBasic.definitionKo}</p>}
          {wordBasic.pronunciation && <p>Korean pronunciation: {wordBasic.pronunciation}</p>}
        </div>
      )}

      {/* 기존 클라이언트 컴포넌트 */}
      <WordDetailClient id={id} initialWord={wordBasic} />
    </>
  );
}
