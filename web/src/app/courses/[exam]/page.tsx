'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuthStore, useExamCourseStore, ExamType } from '@/lib/store';
import { wordsAPI } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';

// 시험별 코스 정보
const getExamInfo = (isEn: boolean): Record<string, {
  name: string;
  fullName: string;
  description: string;
  icon: string;
  gradient: string;
  bgColor: string;
  levels: { id: string; name: string; target: string; wordCount: string }[];
  tips: string[];
}> => ({
  csat: {
    name: isEn ? 'CSAT' : '수능',
    fullName: isEn ? 'College Scholastic Ability Test - English' : '대학수학능력시험 영어',
    description: isEn
      ? 'A core vocabulary course for CSAT English Grade 1-2. Study essential words frequently tested in reading, listening, and grammar.'
      : '수능 영어 1~2등급을 위한 핵심 어휘 코스입니다. 독해, 듣기, 어법에 자주 출제되는 필수 단어들을 학습합니다.',
    icon: '📝',
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    levels: [
      { id: 'L1', name: isEn ? 'Basic Essentials' : '기초 필수', target: isEn ? 'Grade 3 Target' : '3등급 목표', wordCount: '100' },
      { id: 'L2', name: isEn ? 'Core Vocabulary' : '핵심 어휘', target: isEn ? 'Grade 2 Target' : '2등급 목표', wordCount: '100' },
      { id: 'L3', name: isEn ? 'Advanced' : '고난도', target: isEn ? 'Grade 1 Target' : '1등급 목표', wordCount: '100' },
    ],
    tips: isEn
      ? [
          'Study 20 words consistently every day',
          'Memorize frequently tested words with example sentences',
          'Pay attention to polysemous words and their context-dependent meanings',
        ]
      : [
          '매일 20단어씩 꾸준히 학습하세요',
          '빈출 어휘는 예문과 함께 암기하세요',
          '다의어는 문맥에 따른 뜻 변화에 주의하세요',
        ],
  },
  sat: {
    name: 'SAT',
    fullName: isEn ? 'Scholastic Assessment Test' : '미국대학입학시험',
    description: isEn
      ? 'An advanced vocabulary course targeting SAT 1500+. Study words frequently tested in the Evidence-Based Reading section.'
      : 'SAT 1500+ 목표를 위한 고급 어휘 코스입니다. Evidence-Based Reading 섹션 빈출 단어를 학습합니다.',
    icon: '🇺🇸',
    gradient: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    levels: [
      { id: 'L1', name: isEn ? '1200 pts' : '1200점', target: isEn ? '1200 pts Target' : '1200점 목표', wordCount: '80' },
      { id: 'L2', name: isEn ? '1400 pts' : '1400점', target: isEn ? '1400 pts Target' : '1400점 목표', wordCount: '80' },
      { id: 'L3', name: '1500+', target: isEn ? '1500+ pts Target' : '1500점+ 목표', wordCount: '80' },
    ],
    tips: isEn
      ? [
          'Understanding vocabulary meaning in context is key',
          'Study systematically through etymology (Latin, Greek roots)',
          'Focus on advanced adjectives and verbs',
        ]
      : [
          '문맥 속 어휘 의미 파악이 핵심입니다',
          '어원(라틴어, 그리스어)을 통해 체계적으로 학습하세요',
          '고급 형용사와 동사를 집중 공략하세요',
        ],
  },
  toefl: {
    name: 'TOEFL',
    fullName: isEn ? 'Test of English as a Foreign Language' : '학술영어능력시험',
    description: isEn
      ? 'An academic vocabulary course targeting TOEFL 100+. Study specialized vocabulary from university lectures and academic papers.'
      : 'TOEFL 100+ 목표를 위한 학술 어휘 코스입니다. 대학 강의, 학술 논문의 전문 어휘를 학습합니다.',
    icon: '🌍',
    gradient: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    levels: [
      { id: 'L1', name: isEn ? '80 pts' : '80점', target: isEn ? '80 pts Target' : '80점 목표', wordCount: '80' },
      { id: 'L2', name: isEn ? '100 pts' : '100점', target: isEn ? '100 pts Target' : '100점 목표', wordCount: '80' },
      { id: 'L3', name: '110+', target: isEn ? '110+ pts Target' : '110점+ 목표', wordCount: '80' },
    ],
    tips: isEn
      ? [
          'Focus on specialized terminology by academic field',
          'Practice context-based meaning recognition in Reading passages',
          'Learn pronunciation and intonation for Listening prep',
        ]
      : [
          '학술 분야별 전문 용어를 집중 학습하세요',
          'Reading 지문에서 문맥상 의미를 파악하세요',
          'Listening 대비로 발음과 억양도 익히세요',
        ],
  },
  toeic: {
    name: 'TOEIC',
    fullName: isEn ? 'Test of English for International Communication' : '국제의사소통영어시험',
    description: isEn
      ? 'A business vocabulary course targeting TOEIC 900+. Study words used in real workplace environments.'
      : 'TOEIC 900+ 목표를 위한 비즈니스 어휘 코스입니다. 실제 업무 환경에서 사용되는 단어를 학습합니다.',
    icon: '💼',
    gradient: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    levels: [
      { id: 'L1', name: isEn ? '600 pts' : '600점', target: isEn ? '600 pts Target' : '600점 목표', wordCount: '80' },
      { id: 'L2', name: isEn ? '800 pts' : '800점', target: isEn ? '800 pts Target' : '800점 목표', wordCount: '80' },
      { id: 'L3', name: '900+', target: isEn ? '900+ pts Target' : '900점+ 목표', wordCount: '80' },
    ],
    tips: isEn
      ? [
          'Study Part 5,6 frequent vocabulary with part-of-speech variations',
          'Focus on business email and advertisement-related vocabulary',
          'Learn pronunciation patterns for LC prep',
        ]
      : [
          'Part 5,6 빈출 어휘는 품사 변화와 함께 학습하세요',
          '비즈니스 이메일, 광고문 관련 어휘를 집중하세요',
          'LC 대비로 발음 패턴도 함께 익히세요',
        ],
  },
  teps: {
    name: 'TEPS',
    fullName: isEn ? 'Test of English Proficiency (Seoul National Univ.)' : '서울대 영어능력시험',
    description: isEn
      ? 'An advanced vocabulary course targeting TEPS 500+. Study words frequently tested in listening and reading sections.'
      : 'TEPS 500+ 목표를 위한 고급 어휘 코스입니다. 청해와 독해에서 자주 출제되는 단어를 학습합니다.',
    icon: '🎓',
    gradient: 'from-purple-500 to-cyan-600',
    bgColor: 'bg-purple-50',
    levels: [
      { id: 'L1', name: isEn ? '400 pts' : '400점', target: isEn ? '400 pts Target' : '400점 목표', wordCount: '80' },
      { id: 'L2', name: isEn ? '500 pts' : '500점', target: isEn ? '500 pts Target' : '500점 목표', wordCount: '80' },
      { id: 'L3', name: '600+', target: isEn ? '600+ pts Target' : '600점+ 목표', wordCount: '80' },
    ],
    tips: isEn
      ? [
          'TEPS has many synonym questions — understand nuance differences',
          'Focus on academic vocabulary and idiomatic expressions',
          'Practice pronunciation alongside memorization for listening prep',
        ]
      : [
          '유의어 문제가 많으니 뉘앙스 차이를 파악하세요',
          '학술적 어휘와 관용표현을 집중 학습하세요',
          '청해 대비로 발음과 함께 암기하세요',
        ],
  },
});

interface Word {
  id: string;
  word: string;
  definition: string;
  definitionKo: string;
  partOfSpeech: string;
  level: string;
  pronunciation?: string;
  ipaUs?: string;
  ipaUk?: string;
  mnemonics?: {
    id: string;
    content: string;
    koreanHint: string;
  }[];
  etymology?: {
    origin: string;
    language: string;
  };
}

export default function ExamCoursePage() {
  const isEn = useLocale() === 'en';
  const params = useParams();
  const router = useRouter();
  const examKey = (params.exam as string)?.toLowerCase();
  const examInfo = getExamInfo(isEn);
  const exam = examInfo[examKey];

  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!exam) {
      router.push('/dashboard');
      return;
    }

    // Set active exam in store
    setActiveExam(examKey.toUpperCase() as ExamType);

    // Fetch sample words for this exam
    fetchWords();
  }, [hasHydrated, user, exam, examKey, router, setActiveExam]);

  const fetchWords = async () => {
    try {
      // Fetch PUBLISHED words with AI-generated content (using authenticated API)
      const data = await wordsAPI.getWords({
        examCategory: examKey.toUpperCase(),
        limit: 12,
      });
      // API returns data in 'data' or 'words' field
      setWords(data.data || data.words || []);
    } catch (error) {
      console.error('Failed to fetch words:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasHydrated || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{isEn ? 'Loading...' : '로딩 중...'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            VocaVision AI
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
              {isEn ? 'Dashboard' : '대시보드'}
            </Link>
            <Link href="/words" className="text-gray-600 hover:text-blue-600">
              {isEn ? 'Words' : '단어'}
            </Link>
            <Link href="/settings" className="text-gray-600 hover:text-blue-600">
              {isEn ? 'Settings' : '설정'}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`bg-gradient-to-r ${exam.gradient} py-12 text-white`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
            <Link href="/dashboard" className="hover:text-white">{isEn ? 'Dashboard' : '대시보드'}</Link>
            <span>/</span>
            <span>{isEn ? 'Courses' : '코스'}</span>
            <span>/</span>
            <span className="text-white">{exam.name}</span>
          </div>
          <div className="flex items-start gap-6">
            <div className="text-6xl">{exam.icon}</div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{isEn ? `${exam.name} Course` : `${exam.name} 코스`}</h1>
              <p className="text-lg text-white/90 mb-4">{exam.fullName}</p>
              <p className="text-white/80">{exam.description}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        {/* Quick Start */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">{isEn ? "Today's Learning" : '오늘의 학습'}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href={`/learn?exam=${examKey}&level=L1`}
              className={`bg-gradient-to-r ${exam.gradient} text-white rounded-xl p-4 hover:opacity-90 transition`}
            >
              <div className="text-2xl mb-2">📚</div>
              <h3 className="font-bold">{isEn ? 'Word Study' : '단어 학습'}</h3>
              <p className="text-sm text-white/80">{isEn ? 'Start from basics' : '기초부터 시작하기'}</p>
            </Link>
            <Link
              href={`/quiz?exam=${examKey}`}
              className="bg-gray-100 rounded-xl p-4 hover:bg-gray-200 transition"
            >
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-bold text-gray-900">{isEn ? 'Quiz' : '퀴즈'}</h3>
              <p className="text-sm text-gray-600">{isEn ? 'Skills Test' : '실력 테스트'}</p>
            </Link>
            <Link
              href={`/games?exam=${examKey}`}
              className="bg-gray-100 rounded-xl p-4 hover:bg-gray-200 transition"
            >
              <div className="text-2xl mb-2">🎮</div>
              <h3 className="font-bold text-gray-900">{isEn ? 'Games' : '게임'}</h3>
              <p className="text-sm text-gray-600">{isEn ? 'Fun Review' : '재미있게 복습'}</p>
            </Link>
          </div>
        </div>

        {/* Level Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">{isEn ? 'Word Lists by Level' : '레벨별 단어장'}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {exam.levels.map((level) => (
              <Link
                key={level.id}
                href={`/learn?exam=${examKey}&level=${level.id}`}
                className={`${exam.bgColor} border-2 border-transparent hover:border-gray-300 rounded-xl p-5 transition group`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900">{level.name}</h3>
                  <span className="text-sm text-gray-500">{isEn ? `${level.wordCount} words` : `${level.wordCount}단어`}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{level.target}</p>
                <span className="text-sm font-medium text-blue-600 group-hover:underline inline-flex items-center gap-1">
                  {isEn ? 'Start Learning' : '학습하기'} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Sample Words */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{isEn ? `${exam.name} Essential Vocabulary` : `${exam.name} 필수 어휘`}</h2>
            <Link
              href={`/words?exam=${examKey}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
            >
              {isEn ? 'View All' : '전체 보기'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">{isEn ? 'Loading...' : '로딩 중...'}</div>
          ) : words.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {words.map((word) => (
                <Link
                  key={word.id}
                  href={`/words/${word.id}`}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition group border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
                        {word.word}
                      </h3>
                      {word.ipaUs && (
                        <p className="text-xs text-gray-400">{word.ipaUs}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${exam.bgColor} text-gray-700`}>
                      {word.level}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mb-1">{word.partOfSpeech}</p>
                  <p className="text-sm text-gray-700 mb-3">{word.definitionKo}</p>

                  {/* Mnemonic - AI 연상법 */}
                  {word.mnemonics && word.mnemonics[0]?.koreanHint && (
                    <div className="bg-indigo-50 rounded-lg px-3 py-2 mb-2">
                      <p className="text-xs text-indigo-600 font-medium mb-1">{isEn ? '💡 Mnemonic' : '💡 연상법'}</p>
                      <p className="text-xs text-indigo-800">
                        {word.mnemonics[0].koreanHint}
                      </p>
                    </div>
                  )}

                  {/* Korean pronunciation hint */}
                  {word.pronunciation && (
                    <p className="text-xs text-gray-500">
                      🔊 {word.pronunciation}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              <p className="text-lg mb-2">{isEn ? 'No published words yet.' : '아직 발행된 단어가 없습니다.'}</p>
              <p className="text-sm">{isEn ? 'The admin is preparing content.' : '관리자가 콘텐츠를 준비 중입니다.'}</p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">{isEn ? `${exam.name} Study Tips` : `${exam.name} 학습 팁`}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {exam.tips.map((tip, index) => (
              <div key={index} className={`${exam.bgColor} rounded-xl p-4`}>
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-gray-700 mb-3">
                  {index + 1}
                </div>
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
