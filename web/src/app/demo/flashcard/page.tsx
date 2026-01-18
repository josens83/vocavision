'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RotateCcw } from 'lucide-react';

// 샘플 단어 3개
const sampleWords = [
  {
    word: 'CONJECTURE',
    meaning: '추측, 가설',
    pronunciation: '/kənˈdʒek.tʃər/',
    koreanPronunciation: '컨-젝-쳐',
    mnemonic: '"컨젝쳐 = 근데 저? 추측이에요." 퍼즐 조각을 던져서(ject) 모으는(con) 장면',
    example: 'My conjecture about the missing cookies pointed to my cat.',
    exampleKorean: '사라진 쿠키에 대한 내 추측은 고양이를 가리켰다.'
  },
  {
    word: 'CONJURE',
    meaning: '마법처럼 불러내다, 떠올리다',
    pronunciation: '/ˈkʌn.dʒər/',
    koreanPronunciation: '컨-저',
    mnemonic: '"컨저? → 간절히(con) 저(jur)를 불러낸다" 마술사가 공중에서 물건을 소환하는 장면',
    example: 'She can conjure excuses faster than I can conjure thoughts.',
    exampleKorean: '그녀는 내가 생각을 떠올리는 것보다 더 빨리 변명을 소환한다.'
  },
  {
    word: 'CONNOISSEUR',
    meaning: '감식가, 전문가',
    pronunciation: '/ˌkɒn.əˈsɜːr/',
    koreanPronunciation: '콘-너-써어',
    mnemonic: '"콘 노이쓔? → 코로 냄새를 아는 전문가" 와인을 맡고 맛보는 모습',
    example: 'He calls himself a pizza connoisseur, but he only eats pepperoni.',
    exampleKorean: '그는 자신을 피자 감식가라고 부르지만 페퍼로니만 먹는다.'
  }
];

export default function FlashcardDemoPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const currentWord = sampleWords[currentIndex];
  const isComplete = completedCount >= sampleWords.length;

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = () => {
    if (currentIndex < sampleWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setCompletedCount(completedCount + 1);
    } else {
      setCompletedCount(sampleWords.length);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompletedCount(0);
  };

  if (isComplete) {
    return (
      <div className="text-center py-12 pb-24">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">체험 완료!</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          VocaVision의 플래시카드를 체험해보셨습니다.<br />
          실제 학습에서는 <strong className="text-brand-primary">7,600개 이상의 단어</strong>와<br />
          <strong className="text-brand-primary">AI 생성 이미지, 창의적 암기법</strong>을 경험할 수 있어요.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            다시 체험하기
          </button>
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-dark flex items-center justify-center gap-2 transition"
          >
            실제 학습 시작하기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">스마트 플래시카드</h1>
        <p className="text-gray-600">카드를 클릭하여 뒤집어보세요</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {sampleWords.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
                index < completedCount
                  ? 'bg-brand-primary'
                  : index === currentIndex
                  ? 'bg-brand-primary/50 scale-125'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 플래시카드 */}
      <div
        onClick={handleFlip}
        className="relative w-full max-w-lg mx-auto h-80 cursor-pointer"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* 앞면 - 단어 */}
          <div
            className="absolute inset-0 bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <h2 className="text-4xl font-bold text-brand-primary mb-4">{currentWord.word}</h2>
            <p className="text-gray-500">{currentWord.pronunciation}</p>
            <p className="text-gray-400 text-sm">{currentWord.koreanPronunciation}</p>
            <p className="text-sm text-gray-400 mt-6">👆 클릭하여 뒤집기</p>
          </div>

          {/* 뒷면 - 뜻 + 암기법 */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-brand-primary to-brand-primary-dark text-white rounded-2xl shadow-lg p-6 flex flex-col overflow-y-auto"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <h3 className="text-2xl font-bold mb-2">{currentWord.meaning}</h3>

            <div className="mt-4 bg-white/20 rounded-lg p-3">
              <p className="text-sm font-medium mb-1">💡 창의적 암기법</p>
              <p className="text-sm">{currentWord.mnemonic}</p>
            </div>

            <div className="mt-4 bg-white/10 rounded-lg p-3">
              <p className="text-sm font-medium mb-1">📝 예문</p>
              <p className="text-sm italic">&quot;{currentWord.example}&quot;</p>
              <p className="text-xs mt-1 opacity-80">{currentWord.exampleKorean}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 다음 버튼 */}
      <div className="text-center mt-8">
        <button
          onClick={handleNext}
          disabled={!isFlipped}
          className={`px-8 py-3 rounded-xl font-medium transition-all ${
            isFlipped
              ? 'bg-brand-primary text-white hover:bg-brand-primary-dark'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {currentIndex < sampleWords.length - 1 ? '다음 단어' : '체험 완료'}
        </button>
      </div>
    </div>
  );
}
