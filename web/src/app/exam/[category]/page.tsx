'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useLocale } from '@/hooks/useLocale';

// 시험 카테고리 정보
const getExamData = (isEn: boolean): Record<string, {
  name: string;
  fullName: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  levels: { id: string; name: string; target: string; wordCount: string; description: string }[];
  tips: string[];
}> => ({
  csat: {
    name: isEn ? 'CSAT' : '수능',
    fullName: isEn ? 'College Scholastic Ability Test - English' : '대학수학능력시험 영어',
    description: isEn
      ? 'Study essential vocabulary frequently tested in the CSAT English section. Key words for reading, listening, and grammar questions organized by difficulty.'
      : '수능 영어 영역에 자주 출제되는 필수 어휘를 학습하세요. 독해, 듣기, 어법 문제를 위한 핵심 단어들을 난이도별로 정리했습니다.',
    icon: '📝',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    levels: [
      { id: 'basic', name: isEn ? 'Basic' : '기초', target: isEn ? 'Grade 3 Target' : '3등급 목표', wordCount: '800', description: isEn ? 'Essential Basic Vocabulary' : '기본 필수 어휘' },
      { id: 'essential', name: isEn ? 'Essential' : '필수', target: isEn ? 'Grade 2 Target' : '2등급 목표', wordCount: '1,200', description: isEn ? 'Frequently Tested Core Words' : '빈출 핵심 어휘' },
      { id: 'advanced', name: isEn ? 'Advanced' : '심화', target: isEn ? 'Grade 1 Target' : '1등급 목표', wordCount: '1,000', description: isEn ? 'Advanced Vocabulary' : '고난도 어휘' },
    ],
    tips: isEn
      ? [
          'Vocabulary is the foundation of CSAT English! Study 30 words daily',
          'Memorize frequently tested words with example sentences',
          'Pay attention to polysemous words and their context-dependent meanings',
        ]
      : [
          '수능 영어는 어휘력이 기본! 매일 30단어씩 꾸준히',
          '빈출 어휘는 예문과 함께 암기하면 효과적',
          '다의어는 문맥에 따른 뜻 변화 주의',
        ],
  },
  teps: {
    name: 'TEPS',
    fullName: isEn ? 'Test of English Proficiency (Seoul National Univ.)' : '서울대 영어능력시험',
    description: isEn
      ? 'Study advanced vocabulary for high TEPS scores. Words frequently tested in listening and reading sections organized by target score.'
      : 'TEPS 고득점을 위한 고급 어휘를 학습하세요. 청해와 독해에서 자주 출제되는 단어들을 목표 점수별로 정리했습니다.',
    icon: '🎓',
    color: 'from-purple-500 to-cyan-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    levels: [
      { id: '400', name: isEn ? '400 pts' : '400점', target: isEn ? '400 pts Target' : '400점 목표', wordCount: '1,000', description: isEn ? 'Essential Basic Vocabulary' : '기본 필수 어휘' },
      { id: '600', name: isEn ? '600 pts' : '600점', target: isEn ? '600 pts Target' : '600점 목표', wordCount: '1,500', description: isEn ? 'Intermediate Core Vocabulary' : '중급 핵심 어휘' },
      { id: '800', name: isEn ? '800+ pts' : '800점+', target: isEn ? '800+ pts Target' : '800점+ 목표', wordCount: '1,500', description: isEn ? 'Advanced Vocabulary' : '고급 심화 어휘' },
    ],
    tips: isEn
      ? [
          'TEPS has many synonym questions — understanding nuance is key',
          'Focus on academic vocabulary and idiomatic expressions',
          'Practice pronunciation alongside memorization for listening prep',
        ]
      : [
          'TEPS는 유의어 문제가 많아 뉘앙스 차이 파악 중요',
          '학술적 어휘와 관용표현 집중 학습',
          '청해 대비로 발음과 함께 암기',
        ],
  },
  toeic: {
    name: 'TOEIC',
    fullName: isEn ? 'Test of English for International Communication' : '국제의사소통영어시험',
    description: isEn
      ? 'Korea\'s essential employment exam taken by 2 million people annually. Master vocabulary used daily in business emails, meetings, and travel with AI image mnemonics.'
      : '매년 200만 명이 보는 대한민국 취업 필수 시험. 비즈니스 이메일, 회의, 출장 등 실무에서 매일 쓰이는 어휘를 AI 이미지 연상법으로 확실하게 잡습니다.',
    icon: '💼',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-600',
    levels: [
      { id: 'L1', name: 'TOEIC Starter', target: isEn ? '600-700 pts Target' : '600~700점 목표', wordCount: '1,370', description: isEn ? 'Essential vocabulary to pass the basic employment cutoff' : '취업 기본 컷 돌파를 위한 필수 어휘' },
      { id: 'L2', name: 'TOEIC Booster', target: isEn ? '800+ pts Target' : '800점+ 목표', wordCount: '1,121', description: isEn ? 'Core vocabulary for top scores at major companies' : '대기업·외국계 고득점을 위한 핵심 어휘' },
    ],
    tips: isEn
      ? [
          'Study Part 5,6 frequent vocabulary with part-of-speech variations',
          'Focus on business email and advertisement-related vocabulary',
          'For LC prep — learn pronunciation patterns and synonyms together',
        ]
      : [
          'Part 5,6 빈출 어휘는 품사 변화와 함께 학습',
          '비즈니스 이메일·광고문 관련 어휘 집중 공략',
          'LC 대비 — 발음 패턴과 동의어 표현 함께 익히기',
        ],
  },
  toefl: {
    name: 'TOEFL',
    fullName: isEn ? 'Test of English as a Foreign Language' : '학술영어능력시험',
    description: isEn
      ? 'Study 3,651 TOEFL words systematically with Core/Advanced levels. From basic CSAT/EBS-level words to advanced exam vocabulary.'
      : 'TOEFL 3,651개 단어를 Core/Advanced로 체계적으로 학습하세요. 수능/EBS 수준 기본 단어부터 실전 고난도 단어까지.',
    icon: '🌍',
    color: 'from-blue-500 to-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    levels: [
      { id: 'core', name: isEn ? 'TOEFL Core Essentials' : 'TOEFL Core 핵심필수', target: isEn ? 'Essential Words' : '기본필수 단어', wordCount: '1,994', description: isEn ? 'Basic CSAT/EBS-level words' : '수능/EBS 수준 기본 단어' },
      { id: 'advanced', name: isEn ? 'TOEFL Advanced' : 'TOEFL Advanced 실전고난도', target: isEn ? 'Advanced Level' : '실전 고난도', wordCount: '1,657', description: isEn ? 'Advanced academic vocabulary' : '실전 고난도 학술 어휘' },
    ],
    tips: isEn
      ? [
          'Focus on specialized terminology by academic field',
          'Practice context-based meaning recognition in Reading passages',
          'Learn pronunciation and intonation for Listening prep',
        ]
      : [
          '학술 분야별 전문 용어 집중 학습',
          'Reading 지문에서 문맥상 의미 파악 연습',
          'Listening 대비 발음과 억양 함께 익히기',
        ],
  },
  sat: {
    name: 'SAT',
    fullName: isEn ? 'Scholastic Assessment Test' : '미국대학입학시험',
    description: isEn
      ? 'Study advanced vocabulary for high SAT scores. Frequently tested words from the Evidence-Based Reading section.'
      : 'SAT 고득점을 위한 고급 어휘를 학습하세요. Evidence-Based Reading 섹션에서 자주 출제되는 어휘들입니다.',
    icon: '🇺🇸',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-600',
    levels: [
      { id: '1200', name: isEn ? '1200 pts' : '1200점', target: isEn ? '1200 pts Target' : '1200점 목표', wordCount: '1,200', description: isEn ? 'Essential Basic Vocabulary' : '기본 필수 어휘' },
      { id: '1400', name: isEn ? '1400 pts' : '1400점', target: isEn ? '1400 pts Target' : '1400점 목표', wordCount: '1,500', description: isEn ? 'Core Advanced Vocabulary' : '핵심 고급 어휘' },
      { id: '1500', name: isEn ? '1500+ pts' : '1500점+', target: isEn ? '1500+ pts Target' : '1500점+ 목표', wordCount: '1,800', description: isEn ? 'Top-tier Vocabulary' : '최고급 어휘' },
    ],
    tips: isEn
      ? [
          'SAT is all about understanding vocabulary meaning in context',
          'Study systematically through etymology (Latin, Greek roots)',
          'Focus on advanced adjectives and verbs',
        ]
      : [
          'SAT는 문맥 속 어휘 의미 파악이 핵심',
          '어원(라틴어, 그리스어)을 통한 체계적 학습',
          '고급 형용사와 동사 집중 공략',
        ],
  },
  gre: {
    name: 'GRE',
    fullName: isEn ? 'Graduate Record Examinations' : 'GRE 대학원 입학시험',
    description: isEn
      ? 'Master GRE Verbal vocabulary with 4,241 words. Greek & Latin root-based learning for Verbal Reasoning high scores.'
      : 'GRE Verbal 4,241개 단어를 마스터하세요. 그리스어·라틴어 어근 기반으로 체계적으로 학습합니다.',
    icon: '🎓',
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-600',
    levels: [
      { id: 'L1', name: isEn ? 'Verbal' : 'Verbal 핵심', target: isEn ? 'Core GRE vocabulary' : 'GRE 핵심 어휘', wordCount: '~2,100', description: isEn ? 'Essential words for 160+ Verbal score' : 'Verbal 160+ 목표 필수 어휘' },
      { id: 'L2', name: isEn ? 'Elite' : 'Elite 심화', target: isEn ? 'Advanced GRE vocabulary' : 'GRE 고급 어휘', wordCount: '~2,100', description: isEn ? 'Advanced words for 165+ Verbal score' : 'Verbal 165+ 목표 고급 어휘' },
    ],
    tips: isEn
      ? ['Focus on Greek and Latin roots — they appear in 60%+ of GRE words', 'Learn words in context, not just definitions', 'Review etymology breakdowns to understand word families']
      : ['그리스어·라틴어 어근에 집중하세요 — GRE 단어의 60% 이상', '정의뿐 아니라 문맥에서 학습하세요', '어원 분석으로 단어 패밀리를 이해하세요'],
  },
  ielts: {
    name: 'IELTS',
    fullName: isEn ? 'International English Language Testing System' : 'IELTS 국제영어시험',
    description: isEn
      ? 'Build your IELTS vocabulary with 691 essential words for Band 5-8. Foundation and Academic levels for all four skills.'
      : 'IELTS Band 5~8 달성을 위한 691개 핵심 어휘. 4개 영역 대비 Foundation·Academic 구성.',
    icon: '🇬🇧',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-600',
    levels: [
      { id: 'L1', name: isEn ? 'Foundation' : 'Foundation 기초', target: isEn ? 'Band 5-6 vocabulary' : 'Band 5-6 어휘', wordCount: '~350', description: isEn ? 'Essential words for Band 5-6' : 'Band 5-6 필수 어휘' },
      { id: 'L2', name: isEn ? 'Academic' : 'Academic 학술', target: isEn ? 'Band 7-8 vocabulary' : 'Band 7-8 어휘', wordCount: '~340', description: isEn ? 'Advanced academic words for Band 7+' : 'Band 7+ 학술 고급 어휘' },
    ],
    tips: isEn
      ? ['Focus on Academic Word List (AWL) for Writing Task 2', 'Learn collocations, not isolated words', 'Practice with topic-specific vocabulary (environment, technology, education)']
      : ['Writing Task 2를 위해 학술 단어 목록에 집중하세요', '단독 단어가 아닌 연어(collocation)를 학습하세요', '주제별 어휘를 연습하세요 (환경, 기술, 교육)'],
  },
  act: {
    name: 'ACT',
    fullName: isEn ? 'American College Testing' : 'ACT 미국대학입학시험',
    description: isEn
      ? 'Prepare for ACT English and Reading with 822 vocabulary words. Core and Plus levels for comprehensive preparation.'
      : 'ACT English·Reading 대비 822개 어휘. Core(핵심)·Plus(확장) 2단계 체계적 구성.',
    icon: '📐',
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-600',
    levels: [
      { id: 'L1', name: isEn ? 'Core' : 'Core 핵심', target: isEn ? 'Essential ACT vocabulary' : 'ACT 핵심 어휘', wordCount: '~410', description: isEn ? 'Must-know words for ACT 25+' : 'ACT 25+ 필수 어휘' },
      { id: 'L2', name: isEn ? 'Plus' : 'Plus 확장', target: isEn ? 'Advanced ACT vocabulary' : 'ACT 고급 어휘', wordCount: '~410', description: isEn ? 'Advanced words for ACT 30+' : 'ACT 30+ 확장 어휘' },
    ],
    tips: isEn
      ? ['ACT tests vocabulary in context — practice reading passages', 'Focus on commonly confused word pairs', 'Learn rhetorical and transition words for English section']
      : ['ACT는 문맥 속 어휘를 테스트합니다 — 독해 지문 연습하세요', '혼동하기 쉬운 단어 쌍에 집중하세요', 'English 섹션을 위한 수사적·전환 단어를 학습하세요'],
  },
});

interface Word {
  id: string;
  word: string;
  definition: string;
  definitionKo: string;
  pronunciation: string;
  partOfSpeech: string;
  difficulty: string;
}

export default function ExamCategoryPage() {
  const isEn = useLocale() === 'en';
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;
  const examData = getExamData(isEn);
  const exam = examData[category];

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    if (!exam) {
      router.push('/');
      return;
    }

    // Fetch words for this category
    const fetchWords = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const response = await fetch(`${apiUrl}/words/public?examCategory=${category.toUpperCase()}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setWords(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch words:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, [category, exam, router]);

  if (!exam) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            VocaVision AI
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
              >
                {isEn ? 'Dashboard' : '대시보드'}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-blue-600 transition text-sm font-medium"
                >
                  {isEn ? 'Log In' : '로그인'}
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
                >
                  {isEn ? 'Start Free' : '무료 시작'}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-blue-600">{isEn ? 'Home' : '홈'}</Link>
            <span className="text-gray-300">/</span>
            <Link href="/exam" className="text-gray-500 hover:text-blue-600">{isEn ? 'Exams' : '시험'}</Link>
            <span className="text-gray-300">/</span>
            <span className={exam.textColor}>{exam.name}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className={`${exam.bgColor} py-12 md:py-16`}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <div className="text-5xl mb-4">{exam.icon}</div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {isEn ? `${exam.name} Vocabulary` : `${exam.name} 영어단어`}
            </h1>
            <p className="text-lg text-gray-500 mb-4">{exam.fullName}</p>
            <p className="text-gray-600 max-w-2xl mb-6">{exam.description}</p>
            <Link
              href={user ? `/learn?exam=${category}` : '/auth/register'}
              className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${exam.color} text-white rounded-lg font-semibold hover:opacity-90 transition`}
            >
              {user ? (isEn ? 'Start Learning' : '학습 시작하기') : (isEn ? 'Start Free' : '무료로 시작하기')} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Level Cards */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{isEn ? 'Word Lists by Goal' : '목표별 단어장'}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {exam.levels.map((level, index) => (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={user ? `/learn?exam=${category}&level=${level.id}` : '/auth/register'}>
                  <div className={`${exam.bgColor} ${exam.borderColor} border-2 rounded-xl p-6 hover:shadow-lg transition cursor-pointer group`}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{level.name}</h3>
                      <span className={`${exam.textColor} text-sm font-medium bg-white px-3 py-1 rounded-full`}>
                        {isEn ? `${level.wordCount} words` : `${level.wordCount}단어`}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-2">{level.target}</p>
                    <p className="text-gray-600 mb-4">{level.description}</p>
                    <span className={`text-sm font-medium ${exam.textColor} group-hover:underline inline-flex items-center gap-1`}>
                      {isEn ? 'Start Learning' : '학습하기'} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Words */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{isEn ? 'Sample Words' : '샘플 단어'}</h2>
            <Link
              href={user ? `/learn?exam=${category}` : '/auth/register'}
              className={`text-sm font-medium ${exam.textColor} hover:underline inline-flex items-center gap-1`}
            >
              {isEn ? 'View All' : '전체 보기'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">{isEn ? 'Loading...' : '로딩 중...'}</div>
          ) : words.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {words.map((word, index) => (
                <motion.div
                  key={word.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{word.word}</h3>
                    <span className="text-xs text-gray-400">{word.partOfSpeech}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{word.pronunciation}</p>
                  <p className="text-sm text-gray-700">{word.definitionKo || word.definition}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {isEn ? 'Unable to load words. Please try again later.' : '단어를 불러올 수 없습니다. 나중에 다시 시도해주세요.'}
            </div>
          )}
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{isEn ? `${exam.name} Study Tips` : `${exam.name} 학습 팁`}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {exam.tips.map((tip, index) => (
              <div key={index} className={`${exam.bgColor} rounded-xl p-5`}>
                <div className={`w-8 h-8 ${exam.textColor} bg-white rounded-full flex items-center justify-center font-bold mb-3`}>
                  {index + 1}
                </div>
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-12 bg-gradient-to-r ${exam.color}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              {isEn ? `Start your journey to a high ${exam.name} score` : `${exam.name} 고득점을 향해 시작하세요`}
            </h2>
            <p className="text-lg opacity-90 mb-6">
              {isEn ? `Sign up for free and start ${exam.name} vocabulary learning` : `무료로 가입하고 ${exam.name} 맞춤 단어 학습을 시작하세요`}
            </p>
            <Link
              href={user ? `/learn?exam=${category}` : '/auth/register'}
              className="inline-block px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              {user ? (isEn ? 'Start Learning' : '학습 시작하기') : (isEn ? 'Start Free' : '무료로 시작하기')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-xl font-bold text-blue-400 mb-4 md:mb-0">VocaVision AI</div>
            <div className="flex gap-6 text-gray-400 text-sm">
              <Link href="/exam/csat" className="hover:text-white transition">{isEn ? 'CSAT' : '수능'}</Link>
              <Link href="/exam/teps" className="hover:text-white transition">TEPS</Link>
              <Link href="/exam/toeic" className="hover:text-white transition">TOEIC</Link>
              <Link href="/exam/toefl" className="hover:text-white transition">TOEFL</Link>
              <Link href="/exam/sat" className="hover:text-white transition">SAT</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-500 text-sm">
            <p>&copy; 2026 VocaVision AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
