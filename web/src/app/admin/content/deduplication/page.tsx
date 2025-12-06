/**
 * Admin Deduplication Dashboard
 *
 * CSAT 단어와의 중복을 분석하여 콘텐츠 재사용
 * 예상 절감: ~44% (TOEFL 5,000개 중 ~2,000개 중복)
 */

'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  RefreshCw,
  Play,
  Loader2,
  DollarSign,
  Copy,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface ExamStats {
  sourceCount: number;
  targetCount: number;
  overlapCount: number;
  overlapPercentage: number;
  newWordsNeeded: number;
  estimatedCost: number;
  estimatedSavings: number;
}

interface AllStats {
  source: string;
  byExam: Record<string, ExamStats>;
  totals: {
    totalOverlap: number;
    totalNew: number;
    totalSavings: number;
    totalCost: number;
  };
  costPerWord: number;
  timestamp: string;
}

const EXAM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  TOEFL: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  TOEIC: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  TEPS: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  SAT: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export default function DeduplicationPage() {
  const [stats, setStats] = useState<AllStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedingExam, setSeedingExam] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const secretKey = process.env.NEXT_PUBLIC_INTERNAL_SECRET_KEY || '';

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiUrl}/api/internal/deduplication-stats-all?key=${secretKey}&source=CSAT`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      setError(err.message || 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSeedExam = async (exam: string) => {
    setSeedingExam(exam);

    try {
      const response = await fetch(
        `${apiUrl}/api/internal/seed-exam?key=${secretKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam,
            wordList: [], // Empty for now - would be populated with actual word list
            reuseContent: true,
            dryRun: true, // Always dry run from UI for safety
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      alert(`${exam} 시드 (Dry Run) 완료:\n${JSON.stringify(result.result, null, 2)}`);
    } catch (err: any) {
      console.error('Seed failed:', err);
      alert(`시드 실패: ${err.message}`);
    } finally {
      setSeedingExam(null);
    }
  };

  const exams = ['TOEFL', 'TOEIC', 'TEPS', 'SAT'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Copy className="w-6 h-6 text-green-500" />
              콘텐츠 중복 분석
            </h1>
            <p className="text-gray-500 mt-1">
              CSAT 단어와의 중복을 분석하여 콘텐츠 재사용 (~44% 비용 절감)
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 transition"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            새로고침
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            오류: {error}
            <p className="text-sm mt-1">
              API URL: {apiUrl} | Secret Key 설정 필요
            </p>
          </div>
        )}

        {/* CSAT 기준 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-5 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">기준 데이터</p>
              <h3 className="text-2xl font-bold mt-1">
                CSAT (수능) 단어
              </h3>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">
                {stats?.byExam?.TOEFL?.sourceCount?.toLocaleString() || '-'}
              </p>
              <p className="text-blue-100 text-sm">단어</p>
            </div>
          </div>
        </div>

        {/* 시험별 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {exams.map((exam) => {
            const examStats = stats?.byExam?.[exam];
            const colors = EXAM_COLORS[exam];

            return (
              <div
                key={exam}
                className={`bg-white rounded-xl shadow-sm border ${colors.border} p-5 hover:shadow-md transition`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}
                  >
                    {exam}
                  </span>
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>

                {examStats ? (
                  <>
                    {/* 중복률 바 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">CSAT와 중복</span>
                        <span className="font-bold text-green-600">
                          {examStats.overlapPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                          style={{ width: `${examStats.overlapPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* 상세 통계 */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">목표 단어</span>
                        <span className="font-medium">
                          {examStats.targetCount?.toLocaleString() || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">재사용 가능</span>
                        <span className="font-medium text-green-600">
                          {examStats.overlapCount?.toLocaleString() || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">신규 필요</span>
                        <span className="font-medium text-amber-600">
                          {examStats.newWordsNeeded?.toLocaleString() || '-'}
                        </span>
                      </div>
                    </div>

                    {/* 비용 */}
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">예상 비용</span>
                        <span className="font-semibold">
                          ${examStats.estimatedCost?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>절감액</span>
                        <span className="font-semibold">
                          -${examStats.estimatedSavings?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>

                    {/* 시드 버튼 */}
                    <button
                      onClick={() => handleSeedExam(exam)}
                      disabled={seedingExam === exam}
                      className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${colors.bg} ${colors.text} hover:opacity-80 disabled:opacity-50`}
                    >
                      {seedingExam === exam ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {seedingExam === exam ? '시드 중...' : '시드 테스트'}
                    </button>
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    ) : (
                      '데이터 없음'
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 총 절감 효과 */}
        {stats?.totals && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-6 h-6" />
              <h3 className="text-lg font-bold">총 예상 절감 효과</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-3xl font-bold">
                  {stats.totals.totalOverlap.toLocaleString()}
                </p>
                <p className="text-green-100 text-sm">재사용 가능 단어</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {stats.totals.totalNew.toLocaleString()}
                </p>
                <p className="text-green-100 text-sm">신규 생성 필요</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  ${stats.totals.totalSavings.toFixed(0)}
                </p>
                <p className="text-green-100 text-sm">절감 비용</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  ${stats.totals.totalCost.toFixed(0)}
                </p>
                <p className="text-green-100 text-sm">실제 필요 비용</p>
              </div>
            </div>

            {/* 절감률 */}
            <div className="mt-6 pt-4 border-t border-green-400/30">
              <div className="flex items-center justify-between">
                <span className="text-green-100">전체 절감률</span>
                <span className="text-2xl font-bold">
                  ~
                  {stats.totals.totalOverlap + stats.totals.totalNew > 0
                    ? Math.round(
                        (stats.totals.totalOverlap /
                          (stats.totals.totalOverlap + stats.totals.totalNew)) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 사용 방법 */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">사용 방법</h3>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">단어 목록 준비</p>
                <p className="text-gray-500">
                  TOEFL/TOEIC/TEPS 단어 목록을 CSV 또는 JSON 형식으로 준비
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">중복 체크</p>
                <p className="text-gray-500">
                  API로 중복 체크 후 재사용 가능한 단어 확인
                </p>
                <code className="block mt-2 p-2 bg-gray-100 rounded text-xs">
                  POST /api/internal/check-duplicates
                </code>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">시드 실행</p>
                <p className="text-gray-500">
                  중복 단어는 콘텐츠 복사, 신규 단어는 DRAFT로 생성
                </p>
                <code className="block mt-2 p-2 bg-gray-100 rounded text-xs">
                  POST /api/internal/seed-exam
                </code>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-gray-900">콘텐츠 생성</p>
                <p className="text-gray-500">
                  DRAFT 상태 단어에 대해 AI 콘텐츠 생성 실행
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 마지막 업데이트 */}
        {stats?.timestamp && (
          <p className="text-center text-gray-400 text-sm mt-6">
            마지막 업데이트: {new Date(stats.timestamp).toLocaleString('ko-KR')}
          </p>
        )}
      </div>
    </div>
  );
}
