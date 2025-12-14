'use client';

import { Trophy, Clock, Target, RefreshCw, Home, BookOpen } from 'lucide-react';

interface QuizResultData {
  correct: number;
  wrong: number;
  total: number;
  timeSpent: number;
  wrongWords: Array<{
    word: string;
    definitionKo: string;
  }>;
}

interface QuizResultCardProps {
  result: QuizResultData;
  mode: string;
  onRetry: () => void;
  onChangeMode: () => void;
  onHome: () => void;
}

export default function QuizResultCard({
  result,
  onRetry,
  onChangeMode,
  onHome,
}: QuizResultCardProps) {
  const percentage = Math.round((result.correct / result.total) * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const getGrade = () => {
    if (percentage >= 90)
      return { grade: 'A+', color: 'text-green-600', message: '완벽해요! 🎉' };
    if (percentage >= 80)
      return { grade: 'A', color: 'text-green-500', message: '훌륭해요!' };
    if (percentage >= 70)
      return { grade: 'B', color: 'text-blue-500', message: '잘했어요!' };
    if (percentage >= 60)
      return { grade: 'C', color: 'text-yellow-500', message: '조금 더 노력!' };
    return { grade: 'D', color: 'text-red-500', message: '복습이 필요해요' };
  };

  const gradeInfo = getGrade();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* 완료 아이콘 */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-pink-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">퀴즈 완료!</h1>
          <p className="text-gray-500 mt-1">{gradeInfo.message}</p>
        </div>

        {/* 점수 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          {/* 등급 */}
          <div className="text-center mb-6">
            <span className={`text-6xl font-bold ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </span>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-2xl font-bold">{result.correct}</span>
              </div>
              <p className="text-xs text-gray-500">정답</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                <span className="text-2xl font-bold">{result.wrong}</span>
              </div>
              <p className="text-xs text-gray-500">오답</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-lg font-bold">
                  {formatTime(result.timeSpent)}
                </span>
              </div>
              <p className="text-xs text-gray-500">소요 시간</p>
            </div>
          </div>

          {/* 정답률 바 */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">정답률</span>
              <span className="font-semibold">{percentage}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 틀린 단어 목록 */}
        {result.wrongWords.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-500" />
              복습이 필요한 단어 ({result.wrongWords.length}개)
            </h3>
            <div className="space-y-3">
              {result.wrongWords.map((word, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                >
                  <span className="font-medium text-gray-900">{word.word}</span>
                  <span className="text-sm text-gray-600">
                    {word.definitionKo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold
                       py-4 px-6 rounded-xl flex items-center justify-center gap-2
                       transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            다시 도전하기
          </button>

          <button
            onClick={onChangeMode}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium
                       py-3 px-6 rounded-xl transition-colors"
          >
            다른 모드로 학습하기
          </button>

          <button
            onClick={onHome}
            className="w-full text-gray-500 hover:text-gray-700 font-medium
                       py-3 px-6 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
