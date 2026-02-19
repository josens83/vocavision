'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const examCategories = [
  {
    id: 'csat',
    name: '수능',
    fullName: '대학수학능력시험',
    description: '수능 영어 영역 필수 어휘. 독해, 듣기, 어법 문제에 자주 출제되는 핵심 단어들입니다.',
    wordCount: '3,000+',
    icon: '📝',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    features: ['독해 빈출 어휘', '듣기 핵심 표현', '어법 문제 대비'],
  },
  {
    id: 'teps',
    name: 'TEPS',
    fullName: '서울대 영어능력시험',
    description: 'TEPS 고득점을 위한 고급 어휘. 청해와 독해에서 자주 출제되는 단어들입니다.',
    wordCount: '4,000+',
    icon: '🎓',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    features: ['유의어 구별', '학술 어휘', '관용 표현'],
  },
  {
    id: 'toeic',
    name: 'TOEIC',
    fullName: '국제의사소통영어시험',
    description: '비즈니스 영어 핵심 어휘. 사무실, 회의, 출장 등 업무 환경의 단어들입니다.',
    wordCount: '3,500+',
    icon: '💼',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-600',
    features: ['비즈니스 용어', 'Part 5,6 빈출', 'LC 핵심 표현'],
  },
  {
    id: 'toefl',
    name: 'TOEFL',
    fullName: '학술영어능력시험',
    description: '유학 준비 학술 어휘. 대학 강의, 학술 논문에서 사용되는 전문 어휘입니다.',
    wordCount: '5,000+',
    icon: '🌍',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-600',
    features: ['학술 전문 용어', 'Reading 빈출', 'Speaking/Writing'],
  },
  {
    id: 'sat',
    name: 'SAT',
    fullName: '미국대학입학시험',
    description: 'SAT 고득점 고급 어휘. Evidence-Based Reading 섹션 빈출 단어들입니다.',
    wordCount: '4,500+',
    icon: '🇺🇸',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-600',
    features: ['문맥 어휘', '어원 기반 학습', '고급 동사/형용사'],
  },
];

export default function ExamListPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            VocaVision AI
          </Link>
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-blue-600">홈</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">시험별 단어</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              시험별 영어단어
            </h1>
            <p className="text-lg text-gray-600">
              준비 중인 시험을 선택하고 맞춤형 단어 학습을 시작하세요.<br />
              각 시험의 출제 경향에 맞춘 어휘를 제공합니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Exam Categories Grid */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {examCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/exam/${category.id}`}>
                  <div
                    className={`${category.bgColor} ${category.borderColor} border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">{category.icon}</div>
                      <span className={`${category.textColor} text-sm font-medium bg-white px-3 py-1 rounded-full`}>
                        {category.wordCount}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition">
                      {category.name}
                    </h2>
                    <p className="text-sm text-gray-500 mb-3">{category.fullName}</p>
                    <p className="text-gray-600 mb-4 text-sm">{category.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {category.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs bg-white text-gray-600 px-2 py-1 rounded-md"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    <div className={`text-sm font-medium ${category.textColor} group-hover:underline inline-flex items-center gap-1`}>
                      학습 시작하기 <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Choose */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            어떤 시험을 선택할까요?
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-3">🎓 대학 입시 준비</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• <strong>수능</strong> - 한국 대학 입학을 위한 필수</li>
                  <li>• <strong>SAT</strong> - 미국 대학 입학 준비</li>
                  <li>• <strong>TOEFL</strong> - 영어권 대학 유학 준비</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-3">💼 취업/이직 준비</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• <strong>TOEIC</strong> - 대부분의 기업 채용 기준</li>
                  <li>• <strong>TEPS</strong> - 공기업, 공무원 가산점</li>
                  <li>• <strong>TOEFL</strong> - 외국계 기업, 대학원</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-blue-600">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-1">20,000+</div>
              <div className="text-blue-100">총 수록 단어</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">5개</div>
              <div className="text-blue-100">시험 유형</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">15개</div>
              <div className="text-blue-100">목표별 단어장</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">6가지</div>
              <div className="text-blue-100">학습 방법</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-gray-600 mb-6">
              무료로 가입하고 목표 시험에 맞는 단어 학습을 시작하세요
            </p>
            <Link
              href="/auth/register"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              무료로 시작하기
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
              <Link href="/" className="hover:text-white transition">홈</Link>
              <Link href="/exam" className="hover:text-white transition">시험별 단어</Link>
              <Link href="/auth/login" className="hover:text-white transition">로그인</Link>
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
