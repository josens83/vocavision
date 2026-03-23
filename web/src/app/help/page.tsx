'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import TabLayout from '@/components/layout/TabLayout';
import { useLocale } from '@/hooks/useLocale';

// ============================================
// Icons
// ============================================
const Icons = {
  ChevronDown: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Play: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ============================================
// 8 Section Features Data
// ============================================
function getFeatures(isEn: boolean) {
  const items = [
    {
      icon: '🎨',
      title: 'Concept',
      description: isEn
        ? 'Visual concept image'
        : '단어 의미 시각화 이미지',
      badge: 'AI',
    },
    {
      icon: '💡',
      title: 'Mnemonic',
      description: isEn
        ? 'Memory association image'
        : '한국어 연상법 이미지',
      badge: 'AI',
      krOnly: true,
    },
    {
      icon: '🎵',
      title: 'Rhyme',
      description: isEn
        ? 'Rhyme-based scene image'
        : '라임 기반 장면 이미지',
      badge: 'AI',
    },
    {
      icon: '📖',
      title: isEn ? 'Examples' : '예문',
      description: isEn
        ? '4 memorable sentences'
        : '재미있는 예문 4개',
      badge: 'AI',
    },
    {
      icon: '🔗',
      title: 'Collocation',
      description: isEn
        ? '3–5 common phrases'
        : '연어 표현 3~5개',
      badge: 'AI',
    },
    {
      icon: '🌳',
      title: isEn ? 'Etymology' : '어원 분석',
      description: isEn
        ? 'Origin & language source'
        : 'Greek · Latin 어원',
      badge: 'AI',
    },
    {
      icon: '🔬',
      title: isEn ? 'Morphology' : '형태 분석',
      description: isEn
        ? 'Prefix / Root / Suffix'
        : '접두사/어근/접미사',
      badge: 'AI',
    },
    {
      icon: '🎶',
      title: isEn ? 'Rhyming Words' : '라이밍',
      description: isEn
        ? 'Rhyming word chains'
        : '발음 기반 라임 단어',
      badge: 'AI',
    },
  ];

  // Mnemonic은 한국 서비스만 표시
  return isEn ? items.filter(i => !i.krOnly) : items;
}

// ============================================
// Feature Detail Cards Data
// ============================================
function getFeatureDetails(isEn: boolean) {
  return [
    {
      id: 'images',
      icon: '🎨',
      title: isEn ? 'AI Images' : 'AI 생성 이미지',
      subtitle: isEn ? 'Visual learning for better memory' : '시각적 학습으로 기억력 향상',
      content: (
        <div className="space-y-4">
          <div className={`grid ${isEn ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">🎨</div>
              <h4 className="font-semibold text-purple-800 text-sm">Concept</h4>
              <p className="text-xs text-purple-600">{isEn ? 'Core concept' : '핵심 개념 시각화'}</p>
            </div>
            {!isEn && (
              <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">💡</div>
                <h4 className="font-semibold text-teal-800 text-sm">Mnemonic</h4>
                <p className="text-xs text-teal-600">한국어 연상법 이미지</p>
              </div>
            )}
            <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">🎵</div>
              <h4 className="font-semibold text-indigo-800 text-sm">Rhyme</h4>
              <p className="text-xs text-indigo-600">{isEn ? 'Rhyme visual' : '라임 표현 이미지'}</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>{isEn
              ? '• AI generates 2 unique images per word (Concept + Rhyme)'
              : '• AI가 단어마다 3가지 이미지 자동 생성 (Concept + Mnemonic + Rhyme)'
            }</li>
            <li>{isEn ? '• Visual memory for long-term retention' : '• 시각적 기억으로 장기 암기 효과'}</li>
            <li>{isEn ? '• Makes abstract words easy to grasp' : '• 추상적 단어도 쉽게 이해'}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'pronunciation',
      icon: '🎤',
      title: isEn ? 'Pronunciation Guide' : '발음 가이드',
      subtitle: isEn ? 'Clear pronunciation at a glance' : '정확한 발음을 한눈에',
      content: (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-mono text-gray-800">/kənˈdʒek.tʃər/</p>
            {!isEn && <p className="text-xl text-blue-600 mt-2">컨-<span className="font-bold text-teal-600">젝</span>-쳐</p>}
            <p className="text-sm text-gray-500 mt-1">{isEn ? 'Stress: ' : '강세: '}<span className="font-semibold">{isEn ? 'JEC' : '젝'}</span></p>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>{isEn ? '• IPA for precise pronunciation' : '• IPA 발음기호로 정확한 발음'}</li>
            {!isEn && <li>• 한국어 발음으로 쉽게 읽기</li>}
            <li>{isEn ? '• Clear stress position marking' : '• 강세 위치 명확히 표시'}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'etymology',
      icon: '🌳',
      title: isEn ? 'Etymology' : '어원 분석',
      subtitle: isEn ? 'Know the root, know the word' : '뿌리를 알면 단어가 보인다',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4">
            <p className="text-center text-gray-700">
              Latin <span className="font-bold text-amber-700">"conicere"</span>
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">con- ({isEn ? 'together' : '함께'})</span>
              <span className="text-gray-400">+</span>
              <span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">jacere ({isEn ? 'to throw' : '던지다'})</span>
            </div>
            <p className="text-center text-gray-600 mt-3 text-sm">
              {isEn
                ? <>→ "throwing information together" → <span className="font-semibold">guess, conjecture</span></>
                : <>→ "정보를 함께 던져 맞춰본다" → <span className="font-semibold">추측, 가설</span></>
              }
            </p>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>{isEn ? '• Know the root, learn similar words easily!' : '• 어근을 알면 비슷한 단어도 쉽게!'}</li>
            <li>{isEn ? '• Connect: project, inject, reject, etc.' : '• project, inject, reject 등 연결 학습'}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'mnemonic',
      icon: '💡',
      title: isEn ? 'Memory Trick' : '창의적 암기법',
      subtitle: isEn ? 'AI-generated visual mnemonics' : 'AI가 만든 한글 기반 언어유희',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 text-center">
            {isEn ? (
              <>
                <p className="text-lg text-gray-700">
                  "<span className="font-bold text-teal-600">conjecture</span> → con-JEC-ture"
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Break words into syllables to create vivid English associations.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg text-gray-700">
                  "<span className="font-bold text-teal-600">컨젝쳐</span> = 근데 저? 추측이에요."
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  발음이 "근데 저"와 비슷 → 추측한다는 의미 연결
                </p>
              </>
            )}
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>{isEn ? '• Creative associations for each word' : '• 한국어 발음과 연결한 재미있는 연상'}</li>
            <li>{isEn ? '• Memorable visual imagery' : '• 기억에 오래 남는 이미지화'}</li>
            <li>{isEn ? '• AI-crafted custom mnemonics' : '• AI가 단어마다 맞춤 제작'}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'rhyme',
      icon: '🎵',
      title: isEn ? 'Rhyme' : 'Rhyme (라임)',
      subtitle: isEn ? 'Remember naturally through rhyme' : '운율로 자연스럽게 암기',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4">
            <p className="text-center italic text-gray-700">
              "A <span className="font-bold text-indigo-600">conjecture</span> without structure<br />
              leads to rupture."
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              {isEn ? '→ A guess without structure leads to failure.' : '→ 구조 없는 추측은 결국 망한다.'}
            </p>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>{isEn ? '• Memorize words naturally through rhyme' : '• 운율로 단어를 자연스럽게 암기'}</li>
            <li>{isEn ? '• English rhyme with translation' : '• 영어 문장 + 한국어 해석 제공'}</li>
            <li>{isEn ? '• Learn by speaking out loud' : '• 말하면서 외워지는 효과'}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'collocation',
      icon: '🔗',
      title: isEn ? 'Collocation' : 'Collocation (연어)',
      subtitle: isEn ? 'Common word combinations' : '자주 함께 쓰이는 단어 조합',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-teal-200 text-teal-800 px-2 py-0.5 rounded text-sm">pure</span>
                <span className="text-gray-600">conjecture</span>
                <span className="text-gray-400 text-sm">— {isEn ? 'pure guess' : '순수한 추측'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-teal-200 text-teal-800 px-2 py-0.5 rounded text-sm">wild</span>
                <span className="text-gray-600">conjecture</span>
                <span className="text-gray-400 text-sm">— {isEn ? 'wild guess' : '과감한 추측'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-teal-200 text-teal-800 px-2 py-0.5 rounded text-sm">based on</span>
                <span className="text-gray-600">conjecture</span>
                <span className="text-gray-400 text-sm">— {isEn ? 'based on guesswork' : '추측에 근거한'}</span>
              </div>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>{isEn ? '• Natural usage in real English' : '• 실제 영어에서 자연스럽게 사용'}</li>
            <li>{isEn ? '• Frequently tested combinations' : '• 시험에 자주 출제되는 조합'}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'examples',
      icon: '😄',
      title: isEn ? 'Example Sentences' : '재미있는 예문',
      subtitle: isEn ? 'Memorable, engaging sentences' : '기억에 남는 유머러스한 문장',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4">
            <p className="text-gray-700 italic">
              "My <span className="font-bold text-orange-600">conjecture</span> about the missing cookies pointed to my cat—and I was right."
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {isEn ? '→ My guess about the missing cookies pointed to my cat—and I was right.' : '→ 사라진 쿠키에 대한 내 추측은 고양이를 가리켰고, 역시 맞았다.'}
            </p>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>{isEn ? '• Humorous examples that stick' : '• 유머러스한 예문으로 기억에 오래 남음'}</li>
            <li>{isEn ? '• Real-life applicable sentences' : '• 실생활에서 사용 가능한 문장'}</li>
            <li>{isEn ? '• Understand meaning through context' : '• 문맥 속 단어 의미 이해'}</li>
          </ul>
        </div>
      ),
    },
  ];
}

// ============================================
// Spaced Repetition Timeline Data
// ============================================
function getReviewTimeline(isEn: boolean) {
  return [
    { day: 'Day 0', label: isEn ? 'First Study' : '첫 학습', active: true },
    { day: 'Day 1', label: isEn ? 'Review ①' : '복습 ①', active: false },
    { day: 'Day 3', label: isEn ? 'Review ②' : '복습 ②', active: false },
    { day: 'Day 4', label: isEn ? 'Review ③' : '복습 ③', active: false },
    { day: isEn ? 'Done' : '완료', label: isEn ? '2x Correct' : '2회 정답', active: false },
  ];
}

// ============================================
// Flashcard Demo Component
// ============================================
function FlashcardDemo({ isEn }: { isEn: boolean }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoFlip, setAutoFlip] = useState(true);

  useEffect(() => {
    if (!autoFlip) return;
    const interval = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 2500);
    return () => clearInterval(interval);
  }, [autoFlip]);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Card container with perspective */}
      <div
        className="relative h-56 cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => {
          setAutoFlip(false);
          setIsFlipped(!isFlipped);
        }}
      >
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center border-2 border-gray-100"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-sm text-gray-400 mb-2">{isEn ? 'English Word' : '영어 단어'}</p>
            <h2 className="text-3xl font-bold text-gray-800">conjecture</h2>
            <p className="text-sm text-gray-400 mt-4">/kənˈdʒek.tʃər/</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center border-2 border-blue-100"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-sm text-blue-500 mb-2">{isEn ? 'Meaning' : '뜻'}</p>
            <h2 className="text-2xl font-bold text-gray-800">{isEn ? 'guess, hypothesis' : '추측, 가설'}</h2>
            {!isEn && <p className="text-sm text-gray-500 mt-3">컨-젝-쳐</p>}
            <p className="text-xs text-gray-400 mt-4 text-center">
              {isEn ? '💡 con-JEC-ture → guess' : '💡 "근데 저? 추측이에요"'}
            </p>
          </div>
        </div>
      </div>

      {/* Swipe hint */}
      <div className="flex items-center justify-center gap-4 mt-4 text-gray-400 text-sm">
        <span>←</span>
        <span>{isEn ? 'Swipe to navigate' : '스와이프하여 넘기기'}</span>
        <span>→</span>
      </div>
    </div>
  );
}

// ============================================
// Animated Section Wrapper
// ============================================
function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================
// Main Help Page Component
// ============================================
export default function HelpPage() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const features = getFeatures(isEn);
  const featureDetails = getFeatureDetails(isEn);
  const reviewTimeline = getReviewTimeline(isEn);
  const [expandedDetail, setExpandedDetail] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <TabLayout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
        {/* ============================================ */}
        {/* Section 1: Hero */}
        {/* ============================================ */}
        <section className="relative overflow-hidden py-16 px-4">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-30 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-30 blur-3xl" />
          </div>

          <div className="relative max-w-lg mx-auto text-center">
            <div className="text-5xl mb-4">📚</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {isEn ? 'VocaVision AI Study Guide' : 'VocaVision AI 학습 가이드'}
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              {isEn ? 'AI-generated images, etymology, creative mnemonics' : 'AI가 생성한 이미지, 어원 분석, 창의적 암기법으로'}
            </p>
            <p className="text-lg text-gray-600 mb-8">
              {isEn
                ? <>Experience our <span className="text-blue-600 font-semibold">8-section learning method</span></>
                : <><span className="text-blue-600 font-semibold">8섹션 학습법</span>을 경험하세요</>
              }
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              {isEn ? 'Start Learning' : '학습 시작하기'}
              <Icons.ChevronRight />
            </Link>
          </div>
        </section>

        {/* ============================================ */}
        {/* Section 2: 8-Section Grid */}
        {/* ============================================ */}
        <AnimatedSection>
          <section id="features" className="py-12 px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isEn ? '🎯 8-Section Learning Method' : '🎯 VocaVision AI의 8섹션 학습법'}
                </h2>
                <p className="text-gray-500">
                  {isEn
                    ? '7 AI-powered content layers per word'
                    : '단어 하나를 8가지 AI 콘텐츠로 완벽하게 암기'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {features.map((feature, index) => (
                  <button
                    key={feature.title}
                    onClick={() => scrollToSection('details')}
                    className="group relative bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {feature.badge && (
                      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {feature.badge}
                      </span>
                    )}
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-0.5">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {feature.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* ============================================ */}
        {/* Section 3: Feature Details (Accordion) */}
        {/* ============================================ */}
        <AnimatedSection>
          <section id="details" className="py-12 px-4 bg-white/50">
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isEn ? '📖 Section Details' : '📖 각 섹션 상세 설명'}
                </h2>
                <p className="text-gray-500">
                  {isEn ? 'Tap a card to learn more' : '카드를 탭하여 자세히 알아보세요'}
                </p>
              </div>

              <div className="space-y-3">
                {featureDetails.map((detail) => (
                  <div
                    key={detail.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedDetail(expandedDetail === detail.id ? null : detail.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl">{detail.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{detail.title}</h3>
                        <p className="text-xs text-gray-500">{detail.subtitle}</p>
                      </div>
                      <div className={`transition-transform ${expandedDetail === detail.id ? 'rotate-90' : ''}`}>
                        <Icons.ChevronRight />
                      </div>
                    </button>

                    {expandedDetail === detail.id && (
                      <div className="px-4 pb-4 animate-fadeIn">
                        {detail.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* ============================================ */}
        {/* Section 4: Learning Method Demo */}
        {/* ============================================ */}
        <AnimatedSection>
          <section className="py-12 px-4">
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isEn ? '📱 How to Study' : '📱 학습 방법'}
                </h2>
                <p className="text-gray-500">
                  {isEn ? 'Learn easily with swipe gestures' : '스와이프로 간편하게 학습'}
                </p>
              </div>

              <FlashcardDemo isEn={isEn} />

              <div className="mt-8 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-3 text-center">{isEn ? 'Controls' : '조작 방법'}</h3>
                <div className="grid grid-cols-2 gap-2 text-center text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xl mb-1">👆</div>
                    <p className="text-gray-600">{isEn ? 'Tap to reveal' : '정답 보기'}<br/>{isEn ? 'answer' : '버튼 클릭'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xl mb-1">👈👉</div>
                    <p className="text-gray-600">{isEn ? 'Swipe to' : '스와이프로'}<br/>{isEn ? 'navigate' : '넘기기'}</p>
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-blue-700 text-sm font-medium">
                    {isEn ? '📦 1 set = 20 words' : '📦 1세트 = 20개 단어'}
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    {isEn ? 'Complete one set at a time' : '한 세트씩 완료하며 학습하세요'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* ============================================ */}
        {/* Section 5: Spaced Repetition */}
        {/* ============================================ */}
        <AnimatedSection>
          <section className="py-12 px-4 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isEn ? '🧠 Spaced Repetition' : '🧠 과학적 간격 반복 학습'}
                </h2>
                <p className="text-gray-500">
                  {isEn ? 'Review system based on the Ebbinghaus forgetting curve' : '에빙하우스 망각곡선 기반 복습 시스템'}
                </p>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="relative">
                  {/* Line */}
                  <div className="absolute top-4 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 rounded-full" />

                  {/* Points */}
                  <div className="relative flex justify-between">
                    {reviewTimeline.map((item, index) => (
                      <div key={item.day} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10
                            ${index === 0
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border-2 border-gray-200 text-gray-400'
                            }`}
                        >
                          {index + 1}
                        </div>
                        <p className="text-xs font-medium text-gray-700 mt-2">{item.day}</p>
                        <p className="text-xs text-gray-400">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{isEn ? '2 days study / 1 day rest pattern' : '2일 학습 / 1일 휴식 패턴'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span>{isEn ? 'Mastered after 2 correct answers' : '2회 정답 시 완전 암기 처리'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>{isEn ? 'Easy words reviewed only on D+3' : '쉬운 단어는 D+3에만 복습'}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* ============================================ */}
        {/* Section 6: CTA */}
        {/* ============================================ */}
        <AnimatedSection>
          <section className="py-16 px-4">
            <div className="max-w-lg mx-auto text-center">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isEn ? 'Get Started Now!' : '지금 바로 시작하세요!'}
              </h2>
              <p className="text-gray-500 mb-8">
                {isEn ? 'Master English vocabulary with VocaVision AI' : 'VocaVision AI와 함께 영어 단어를 정복하세요'}
              </p>

              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
              >
                {isEn ? 'Start for Free' : '무료로 시작하기'}
                <Icons.ChevronRight />
              </Link>

              <p className="mt-4 text-sm text-gray-400">
                {isEn ? '800+ SAT Starter words free after sign-up' : '회원가입 후 수능 L1 무료 체험 가능'}
              </p>
            </div>
          </section>
        </AnimatedSection>

        {/* Footer spacing */}
        <div className="h-8" />
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </TabLayout>
  );
}
