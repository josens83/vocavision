"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";

// 2027학년도 수능일: 2026년 11월 19일 (목)
const CSAT_DATE = new Date("2026-11-19T00:00:00");

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

// 카운터 박스 컴포넌트
function CounterBox({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gray-100 flex items-center justify-center">
        <span className="text-2xl md:text-3xl font-bold text-gray-900">{value}</span>
      </div>
      <span className="text-xs text-gray-500 mt-1 block">{label}</span>
    </div>
  );
}

export default function DDayBanner() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();
  const isLoggedIn = !!user;

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
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="h-20 animate-pulse bg-gray-100 rounded-2xl" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6 md:py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* 왼쪽: 텍스트 */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-3">
                2027학년도 수능
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                수능까지 <span className="text-teal-600">D-{timeLeft.days}</span>
              </h2>
              <p className="text-gray-500 text-sm mt-2">
                매일 20단어씩 학습하면 수능 전 완벽 마스터!
              </p>
            </div>

            {/* 중앙: 카운트다운 */}
            <div className="flex items-center gap-2 md:gap-3">
              <CounterBox value={timeLeft.days} label="일" />
              <span className="text-gray-400 text-2xl font-light">:</span>
              <CounterBox value={String(timeLeft.hours).padStart(2, "0")} label="시간" />
              <span className="text-gray-400 text-2xl font-light">:</span>
              <CounterBox value={String(timeLeft.minutes).padStart(2, "0")} label="분" />
              <span className="text-gray-400 text-2xl font-light">:</span>
              <CounterBox value={String(timeLeft.seconds).padStart(2, "0")} label="초" />
            </div>

            {/* 오른쪽: CTA - 비로그인 시에만 표시 */}
            {!isLoggedIn && (
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors"
              >
                <span>요금제 보기</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
