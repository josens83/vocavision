'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

// 시험 카테고리 정보
const examData: Record<string, {
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
}> = {
  csat: {
    name: '수능',
    fullName: '대학수학능력시험 영어',
    description: '수능 영어 영역에 자주 출제되는 필수 어휘를 학습하세요. 독해, 듣기, 어법 문제를 위한 핵심 단어들을 난이도별로 정리했습니다.',
    icon: '📝',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    levels: [
      { id: 'basic', name: '기초', target: '3등급 목표', wordCount: '800', description: '기본 필수 어휘' },
      { id: 'essential', name: '필수', target: '2등급 목표', wordCount: '1,200', description: '빈출 핵심 어휘' },
      { id: 'advanced', name: '심화', target: '1등급 목표', wordCount: '1,000', description: '고난도 어휘' },
    ],
    tips: [
      '수능 영어는 어휘력이 기본! 매일 30단어씩 꾸준히',
      '빈출 어휘는 예문과 함께 암기하면 효과적',
      '다의어는 문맥에 따른 뜻 변화 주의',
    ],
  },
  teps: {
    name: 'TEPS',
    fullName: '서울대 영어능력시험',
    description: 'TEPS 고득점을 위한 고급 어휘를 학습하세요. 청해와 독해에서 자주 출제되는 단어들을 목표 점수별로 정리했습니다.',
    icon: '🎓',
    color: 'from-purple-500 to-cyan-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    levels: [
      { id: '400', name: '400점', target: '400점 목표', wordCount: '1,000', description: '기본 필수 어휘' },
      { id: '600', name: '600점', target: '600점 목표', wordCount: '1,500', description: '중급 핵심 어휘' },
      { id: '800', name: '800점+', target: '800점+ 목표', wordCount: '1,500', description: '고급 심화 어휘' },
    ],
    tips: [
      'TEPS는 유의어 문제가 많아 뉘앙스 차이 파악 중요',
      '학술적 어휘와 관용표현 집중 학습',
      '청해 대비로 발음과 함께 암기',
    ],
  },
  toeic: {
    name: 'TOEIC',
    fullName: '국제의사소통영어시험',
    description: '비즈니스 영어의 핵심 어휘를 학습하세요. 사무실, 회의, 출장 등 실제 업무 환경에서 사용되는 단어들입니다.',
    icon: '💼',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-600',
    levels: [
      { id: '600', name: '600점', target: '600점 목표', wordCount: '800', description: '기초 비즈니스 어휘' },
      { id: '800', name: '800점', target: '800점 목표', wordCount: '1,200', description: '핵심 비즈니스 어휘' },
      { id: '900', name: '900점+', target: '900점+ 목표', wordCount: '1,500', description: '고급 비즈니스 어휘' },
    ],
    tips: [
      'Part 5,6 빈출 어휘는 품사 변화와 함께 학습',
      '비즈니스 이메일, 광고문 관련 어휘 집중',
      'LC 대비로 발음 패턴도 함께 익히기',
    ],
  },
  toefl: {
    name: 'TOEFL',
    fullName: '학술영어능력시험',
    description: '유학 준비를 위한 학술 영어 어휘를 학습하세요. 대학 강의, 학술 논문에서 사용되는 전문 어휘들입니다.',
    icon: '🌍',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-600',
    levels: [
      { id: '80', name: '80점', target: '80점 목표', wordCount: '1,500', description: '기본 학술 어휘' },
      { id: '100', name: '100점', target: '100점 목표', wordCount: '2,000', description: '핵심 학술 어휘' },
      { id: '110', name: '110점+', target: '110점+ 목표', wordCount: '1,500', description: '고급 학술 어휘' },
    ],
    tips: [
      '학술 분야별 전문 용어 집중 학습',
      'Reading 지문에서 문맥상 의미 파악 연습',
      'Listening 대비 발음과 억양 함께 익히기',
    ],
  },
  sat: {
    name: 'SAT',
    fullName: '미국대학입학시험',
    description: 'SAT 고득점을 위한 고급 어휘를 학습하세요. Evidence-Based Reading 섹션에서 자주 출제되는 어휘들입니다.',
    icon: '🇺🇸',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-600',
    levels: [
      { id: '1200', name: '1200점', target: '1200점 목표', wordCount: '1,200', description: '기본 필수 어휘' },
      { id: '1400', name: '1400점', target: '1400점 목표', wordCount: '1,500', description: '핵심 고급 어휘' },
      { id: '1500', name: '1500점+', target: '1500점+ 목표', wordCount: '1,800', description: '최고급 어휘' },
    ],
    tips: [
      'SAT는 문맥 속 어휘 의미 파악이 핵심',
      '어원(라틴어, 그리스어)을 통한 체계적 학습',
      '고급 형용사와 동사 집중 공략',
    ],
  },
};

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
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;
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
        const response = await fetch(`${apiUrl}/api/words/public?examCategory=${category.toUpperCase()}&limit=10`);
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
                대시보드
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-blue-600 transition text-sm font-medium"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
                >
                  무료 시작
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
            <Link href="/" className="text-gray-500 hover:text-blue-600">홈</Link>
            <span className="text-gray-300">/</span>
            <Link href="/exam" className="text-gray-500 hover:text-blue-600">시험</Link>
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
              {exam.name} 영어단어
            </h1>
            <p className="text-lg text-gray-500 mb-4">{exam.fullName}</p>
            <p className="text-gray-600 max-w-2xl mb-6">{exam.description}</p>
            <Link
              href={user ? `/learn?exam=${category}` : '/auth/register'}
              className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${exam.color} text-white rounded-lg font-semibold hover:opacity-90 transition`}
            >
              {user ? '학습 시작하기' : '무료로 시작하기'} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Level Cards */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">목표별 단어장</h2>
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
                        {level.wordCount}단어
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-2">{level.target}</p>
                    <p className="text-gray-600 mb-4">{level.description}</p>
                    <span className={`text-sm font-medium ${exam.textColor} group-hover:underline inline-flex items-center gap-1`}>
                      학습하기 <ArrowRight className="w-3.5 h-3.5" />
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
            <h2 className="text-2xl font-bold text-gray-900">샘플 단어</h2>
            <Link
              href={user ? `/learn?exam=${category}` : '/auth/register'}
              className={`text-sm font-medium ${exam.textColor} hover:underline inline-flex items-center gap-1`}
            >
              전체 보기 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
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
              단어를 불러올 수 없습니다. 나중에 다시 시도해주세요.
            </div>
          )}
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{exam.name} 학습 팁</h2>
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
              {exam.name} 고득점을 향해 시작하세요
            </h2>
            <p className="text-lg opacity-90 mb-6">
              무료로 가입하고 {exam.name} 맞춤 단어 학습을 시작하세요
            </p>
            <Link
              href={user ? `/learn?exam=${category}` : '/auth/register'}
              className="inline-block px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              {user ? '학습 시작하기' : '무료로 시작하기'}
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
              <Link href="/exam/csat" className="hover:text-white transition">수능</Link>
              <Link href="/exam/teps" className="hover:text-white transition">TEPS</Link>
              <Link href="/exam/toeic" className="hover:text-white transition">TOEIC</Link>
              <Link href="/exam/toefl" className="hover:text-white transition">TOEFL</Link>
              <Link href="/exam/sat" className="hover:text-white transition">SAT</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-500 text-sm">
            <p>&copy; 2025 VocaVision AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
