"use client";

import Link from "next/link";

interface LearningSession {
  /** Deck or lesson ID */
  id: string;
  /** Title of the lesson/deck */
  title: string;
  /** Exam category (CSAT, TOEFL, etc.) */
  exam: string;
  /** Level (L1, L2, L3) */
  level: string;
  /** Words learned */
  wordsLearned: number;
  /** Total words */
  totalWords: number;
  /** Last studied timestamp */
  lastStudied: Date | string;
  /** Type of study mode */
  mode: "flashcard" | "quiz" | "review";
}

interface ContinueLearningProps {
  session?: LearningSession | null;
  className?: string;
}

const modeConfig = {
  flashcard: {
    icon: "🎴",
    label: "플래시카드",
    color: "from-yellow-400 to-orange-500",
    href: "/learn",
  },
  quiz: {
    icon: "❓",
    label: "퀴즈",
    color: "from-red-400 to-pink-500",
    href: "/quiz",
  },
  review: {
    icon: "🔄",
    label: "복습",
    color: "from-blue-400 to-indigo-500",
    href: "/review",
  },
};

const levelColors: Record<string, string> = {
  L1: "bg-green-100 text-green-700",
  L2: "bg-blue-100 text-blue-700",
  L3: "bg-purple-100 text-purple-700",
};

function formatLastStudied(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return d.toLocaleDateString("ko-KR");
}

export function ContinueLearning({ session, className = "" }: ContinueLearningProps) {
  // If no session, show empty state with start learning CTA
  if (!session) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 ${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="text-3xl">📚</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">학습을 시작해보세요!</h3>
          <p className="text-sm text-slate-500 mb-6">
            첫 번째 단어 학습을 시작하면 여기에 진행 상황이 표시됩니다.
          </p>
          <Link
            href="/learn?exam=CSAT"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-medium rounded-xl hover:bg-brand-primary/90 transition-colors"
          >
            <span>🚀</span>
            학습 시작하기
          </Link>
        </div>
      </div>
    );
  }

  const mode = modeConfig[session.mode];
  const progress = Math.round((session.wordsLearned / session.totalWords) * 100);
  const href = `${mode.href}?exam=${session.exam}&level=${session.level}`;

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">이어서 학습하기</h3>
        <span className="text-xs text-slate-400">
          {formatLastStudied(session.lastStudied)}
        </span>
      </div>

      {/* Session Card */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-4">
          {/* Mode Icon */}
          <div
            className={`
              w-14 h-14 rounded-xl flex items-center justify-center text-2xl
              bg-gradient-to-br ${mode.color} shadow-md
            `}
          >
            {mode.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${levelColors[session.level] || "bg-slate-100 text-slate-600"}`}>
                {session.level}
              </span>
              <span className="text-xs text-slate-400">{mode.label}</span>
            </div>
            <h4 className="font-semibold text-slate-900 truncate">{session.title}</h4>
            <p className="text-sm text-slate-500 mt-0.5">
              {session.exam} · {session.wordsLearned}/{session.totalWords} 단어
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500">진행률</span>
            <span className="font-medium text-slate-700">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${mode.color} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={href}
          className={`
            flex items-center justify-center gap-2 py-3 px-4
            bg-gradient-to-r ${mode.color} text-white font-medium rounded-xl
            hover:shadow-lg transition-all hover:-translate-y-0.5
          `}
        >
          <span>▶</span>
          이어서 학습
        </Link>
        <Link
          href="/learn"
          className="
            flex items-center justify-center gap-2 py-3 px-4
            bg-slate-100 text-slate-700 font-medium rounded-xl
            hover:bg-slate-200 transition-colors
          "
        >
          <span>📚</span>
          다른 학습
        </Link>
      </div>
    </div>
  );
}

export default ContinueLearning;
