"use client";

import Link from "next/link";
import { PLATFORM_STATS } from "@/constants/stats";
import { useComingSoon } from "@/components/ui/ComingSoonModal";

interface ExamIcon {
  id: string;
  name: string;
  nameKo: string;
  href: string;
  color: string;
  bgColor: string;
  wordCount: number;
  isAvailable: boolean;
  isPremium?: boolean;
}

const examIcons: ExamIcon[] = [
  {
    id: "csat",
    name: "CSAT",
    nameKo: "수능",
    href: "/courses/csat",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    wordCount: PLATFORM_STATS.totalWords,
    isAvailable: true,
  },
  {
    id: "sat",
    name: "SAT",
    nameKo: "미국 수능",
    href: "/courses/sat",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    wordCount: 4500,
    isAvailable: false,
  },
  {
    id: "toefl",
    name: "TOEFL",
    nameKo: "토플",
    href: "/courses/toefl",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    wordCount: 5000,
    isAvailable: false,
  },
  {
    id: "toeic",
    name: "TOEIC",
    nameKo: "토익",
    href: "/courses/toeic",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    wordCount: 3500,
    isAvailable: false,
  },
  {
    id: "teps",
    name: "TEPS",
    nameKo: "텝스",
    href: "/learn?exam=TEPS",
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    wordCount: PLATFORM_STATS.exams.TEPS.words,
    isAvailable: true,
    isPremium: true,
  },
];

function ExamIconCard({ exam, onComingSoonClick }: { exam: ExamIcon; onComingSoonClick?: (name: string) => void }) {
  const content = (
    <div className="flex flex-col items-center group">
      {/* 원형 아이콘 */}
      <div
        className={`
          w-16 h-16 md:w-20 md:h-20 rounded-full
          ${exam.bgColor} ${exam.color}
          flex items-center justify-center
          transition-all duration-300
          group-hover:scale-110 group-hover:shadow-lg
          ${!exam.isAvailable ? "opacity-60 grayscale-[30%]" : ""}
        `}
      >
        <span className="text-xl md:text-2xl font-bold">{exam.name.charAt(0)}</span>
      </div>

      {/* 시험명 */}
      <div className="mt-3 text-center">
        <p className={`font-semibold ${exam.color} ${!exam.isAvailable ? "opacity-60" : ""}`}>
          {exam.name}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{exam.nameKo}</p>
      </div>

      {/* 단어 수 / 상태 배지 */}
      <div className="mt-2 flex flex-col items-center gap-1">
        {exam.isAvailable ? (
          <>
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              {exam.wordCount.toLocaleString()}단어
            </span>
            {exam.isPremium && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full">
                Premium
              </span>
            )}
          </>
        ) : (
          <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 rounded-full">
            준비중
          </span>
        )}
      </div>
    </div>
  );

  if (exam.isAvailable) {
    return (
      <Link href={exam.href} className="block p-4 rounded-2xl hover:bg-white transition-colors">
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={() => onComingSoonClick?.(exam.nameKo)}
      className="block p-4 rounded-2xl hover:bg-white/50 transition-colors cursor-pointer"
    >
      {content}
    </button>
  );
}

export default function ExamIconGrid() {
  const { showComingSoon } = useComingSoon();

  const handleComingSoonClick = (examName: string) => {
    showComingSoon({
      itemName: `${examName} 단어장`,
      message: `${examName} 단어장은 곧 추가될 예정이에요.\n조금만 기다려 주세요!`,
    });
  };

  return (
    <div className="text-center">
      {/* 섹션 헤더 */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
          시험별 <span className="text-gradient">빠른 학습</span>
        </h2>
        <p className="text-slate-600">
          목표 시험을 선택하고 바로 학습을 시작하세요
        </p>
      </div>

      {/* 아이콘 그리드 */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 max-w-2xl mx-auto">
        {examIcons.map((exam) => (
          <ExamIconCard
            key={exam.id}
            exam={exam}
            onComingSoonClick={handleComingSoonClick}
          />
        ))}
      </div>

      {/* 하단 안내 */}
      <p className="mt-6 text-sm text-slate-400">
        수능(CSAT)과 TEPS 어휘가 학습 가능합니다. TOEFL, TOEIC, SAT는 곧 추가됩니다.
      </p>
    </div>
  );
}
