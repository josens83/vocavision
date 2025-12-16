"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// 2025 수능일: 2025년 11월 13일
const CSAT_DATE = new Date("2025-11-13T00:00:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const difference = CSAT_DATE.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function DDayBanner() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <section className="bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="h-20 animate-pulse bg-white/10 rounded-xl" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* 왼쪽: 텍스트 */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold mb-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              2025 수능
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              수능까지 <span className="text-yellow-400">D-{timeLeft.days}</span>
            </h2>
            <p className="text-white/70 text-sm mt-1">
              매일 20단어씩 학습하면 수능 전 완벽 마스터!
            </p>
          </div>

          {/* 중앙: 카운트다운 */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-bold text-white">{timeLeft.days}</span>
              </div>
              <span className="text-xs text-white/60 mt-1 block">일</span>
            </div>
            <span className="text-white/40 text-2xl font-light">:</span>
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-bold text-white">{String(timeLeft.hours).padStart(2, "0")}</span>
              </div>
              <span className="text-xs text-white/60 mt-1 block">시간</span>
            </div>
            <span className="text-white/40 text-2xl font-light">:</span>
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-bold text-white">{String(timeLeft.minutes).padStart(2, "0")}</span>
              </div>
              <span className="text-xs text-white/60 mt-1 block">분</span>
            </div>
            <span className="text-white/40 text-2xl font-light">:</span>
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-bold text-yellow-400">{String(timeLeft.seconds).padStart(2, "0")}</span>
              </div>
              <span className="text-xs text-white/60 mt-1 block">초</span>
            </div>
          </div>

          {/* 오른쪽: CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/learn?exam=CSAT"
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-semibold rounded-xl transition-all hover:scale-105"
            >
              지금 학습 시작
            </Link>
            <Link
              href="/quiz?exam=CSAT"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/20"
            >
              퀴즈 도전
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
