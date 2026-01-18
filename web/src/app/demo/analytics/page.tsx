'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, Calendar, Target, Brain } from 'lucide-react';

// 샘플 데이터
const sampleData = {
  totalWords: 1247,
  streak: 15,
  accuracy: 78,
  growth: 12,
  weeklyActivity: [3, 5, 2, 8, 6, 4, 7], // 일~토
  masteryDistribution: {
    mastered: 45,
    familiar: 30,
    learning: 15,
    new: 10
  }
};

export default function AnalyticsDemoPage() {
  return (
    <div className="pb-24">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">학습 분석</h1>
        <p className="text-gray-600">나의 학습 현황을 한눈에 파악하세요</p>

        <div className="mt-4 inline-block bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
          <p className="text-sm text-yellow-700">
            📊 아래는 <strong>샘플 데이터</strong>입니다. 실제 학습 시 자동으로 기록됩니다.
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <Brain className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{sampleData.totalWords}</p>
          <p className="text-sm text-gray-500">학습한 단어</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <Calendar className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{sampleData.streak}일</p>
          <p className="text-sm text-gray-500">연속 학습</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{sampleData.accuracy}%</p>
          <p className="text-sm text-gray-500">정답률</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">+{sampleData.growth}%</p>
          <p className="text-sm text-gray-500">이번 주 성장</p>
        </div>
      </div>

      {/* 주간 활동 그래프 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">📅 주간 학습 활동</h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div key={day} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t transition-all hover:from-purple-600 hover:to-purple-500"
                style={{ height: `${sampleData.weeklyActivity[index] * 12}px` }}
              />
              <span className="text-xs text-gray-500 mt-2">{day}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">
          막대 높이 = 학습한 단어 수
        </p>
      </div>

      {/* 숙련도 분포 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">🎯 숙련도 분포</h3>
        <div className="space-y-3">
          {[
            { label: '완벽히 암기', value: sampleData.masteryDistribution.mastered, color: 'bg-green-500' },
            { label: '익숙함', value: sampleData.masteryDistribution.familiar, color: 'bg-blue-500' },
            { label: '학습 중', value: sampleData.masteryDistribution.learning, color: 'bg-yellow-500' },
            { label: '새 단어', value: sampleData.masteryDistribution.new, color: 'bg-gray-400' }
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-24">{item.label}</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI 분석 인사이트 (더미) */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">🤖 AI 학습 분석</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              ⏰
            </div>
            <div>
              <p className="font-medium text-gray-900">최적 학습 시간</p>
              <p className="text-sm text-gray-500">오후 7-9시에 집중도가 가장 높아요</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              📈
            </div>
            <div>
              <p className="font-medium text-gray-900">학습 패턴</p>
              <p className="text-sm text-gray-500">평균 세션 18분, 세션당 25개 단어 학습</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              🎯
            </div>
            <div>
              <p className="font-medium text-gray-900">추천 목표</p>
              <p className="text-sm text-gray-500">하루 30개 단어 학습을 추천합니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          나만의 학습 분석을 시작하세요
        </h3>
        <p className="text-gray-600 mb-6">
          VocaVision이 당신의 학습 패턴을 분석하고<br />
          최적의 복습 시점을 자동으로 알려드립니다.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
        >
          학습 시작하기
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
