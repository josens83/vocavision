"use client";

import Link from "next/link";
import { useComingSoon } from "@/components/ui/ComingSoonModal";

interface ExamCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  href: string;
  available: boolean;
}

// 시험 카테고리 데이터 (4x2 그리드)
const examCategories: ExamCategory[] = [
  {
    id: "CSAT",
    name: "수능",
    icon: "📚",
    color: "bg-pink-100 text-pink-600",
    href: "/learn?exam=CSAT",
    available: true,
  },
  {
    id: "TEPS",
    name: "TEPS",
    icon: "🎯",
    color: "bg-purple-100 text-purple-600",
    href: "/learn?exam=TEPS",
    available: true,
  },
  {
    id: "TOEFL",
    name: "TOEFL",
    icon: "🌍",
    color: "bg-blue-100 text-blue-600",
    href: "/learn?exam=TOEFL",
    available: false,
  },
  {
    id: "TOEIC",
    name: "TOEIC",
    icon: "💼",
    color: "bg-green-100 text-green-600",
    href: "/learn?exam=TOEIC",
    available: false,
  },
  {
    id: "SAT",
    name: "SAT",
    icon: "🎓",
    color: "bg-amber-100 text-amber-600",
    href: "/learn?exam=SAT",
    available: false,
  },
  {
    id: "IELTS",
    name: "IELTS",
    icon: "✈️",
    color: "bg-cyan-100 text-cyan-600",
    href: "/learn?exam=IELTS",
    available: false,
  },
  {
    id: "GRE",
    name: "GRE",
    icon: "🔬",
    color: "bg-red-100 text-red-600",
    href: "/learn?exam=GRE",
    available: false,
  },
];

export default function ExamIconGrid() {
  const { showComingSoon } = useComingSoon();

  const handleComingSoonClick = (examName: string) => {
    showComingSoon({
      itemName: `${examName}`,
      message: `${examName}은(는) 곧 추가될 예정이에요.\n조금만 기다려 주세요!`,
    });
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 섹션 헤더 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            시험별 <span className="text-gradient">빠른 학습</span>
          </h2>
          <p className="text-slate-600">
            목표 시험을 선택하고 바로 학습을 시작하세요
          </p>
        </div>

        {/* 시험 아이콘 그리드 */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-lg mx-auto justify-items-center">
          {examCategories.map((exam) => (
            <div key={exam.id} className="relative">
              {exam.available ? (
                <Link
                  href={exam.href}
                  className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl ${exam.color} hover:scale-105 active:scale-95 transition-transform duration-200 aspect-square shadow-sm`}
                >
                  <span className="text-2xl sm:text-3xl mb-1 sm:mb-2">{exam.icon}</span>
                  <span className="text-xs sm:text-sm font-medium truncate w-full text-center">
                    {exam.name}
                  </span>
                </Link>
              ) : (
                <button
                  onClick={() => handleComingSoonClick(exam.name)}
                  className="w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-slate-50 text-slate-400 aspect-square cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="text-2xl sm:text-3xl mb-1 sm:mb-2 grayscale opacity-50">
                    {exam.icon}
                  </span>
                  <span className="text-xs sm:text-sm font-medium truncate w-full text-center">
                    {exam.name}
                  </span>
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-medium rounded-full">
                    준비중
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
