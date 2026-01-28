"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";

interface FABAction {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
  badge?: number;
}

const Icons = {
  Flashcard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Quiz: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Review: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Stats: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Close: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Study: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
};

export default function StudyFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Hide FAB on certain pages (auth, admin, etc.)
  const hiddenPaths = ["/auth", "/admin", "/learn", "/quiz", "/review"];
  const shouldHide = hiddenPaths.some((path) => pathname?.startsWith(path));

  // Show FAB after scroll and only for logged-in users
  useEffect(() => {
    if (!user || shouldHide) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user, shouldHide]);

  // Close FAB when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = () => setIsOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (!isVisible) return null;

  const actions: FABAction[] = [
    {
      icon: <Icons.Flashcard />,
      label: "플래시카드",
      href: "/learn?exam=CSAT&level=L1&demo=true",
      color: "bg-amber-500",
    },
    {
      icon: <Icons.Quiz />,
      label: "퀴즈",
      href: "/quiz?exam=CSAT",
      color: "bg-rose-500",
    },
    {
      icon: <Icons.Review />,
      label: "복습",
      href: "/review?exam=CSAT",
      color: "bg-teal-500",
      // badge: 5, // Uncomment when review count is available
    },
    {
      icon: <Icons.Stats />,
      label: "통계",
      href: "/stats",
      color: "bg-purple-500",
    },
  ];

  return (
    <div
      className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Action Menu */}
      <div
        className={`absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {actions.map((action, index) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 group"
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
            }}
          >
            {/* Label */}
            <span className="px-3 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              {action.label}
            </span>

            {/* Icon Button */}
            <div className="relative">
              <button
                className={`w-12 h-12 rounded-full ${action.color} text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95`}
              >
                {action.icon}
              </button>
              {action.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                  {action.badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-slate-700 rotate-45"
            : "bg-gradient-to-br from-brand-primary to-brand-secondary hover:shadow-2xl hover:scale-105"
        }`}
        aria-label={isOpen ? "메뉴 닫기" : "학습 메뉴 열기"}
      >
        {isOpen ? (
          <Icons.Close />
        ) : (
          <span className="text-white">
            <Icons.Study />
          </span>
        )}
      </button>

      {/* Tooltip on first visit */}
      {!isOpen && (
        <div className="absolute bottom-full right-0 mb-2 opacity-0 animate-fade-in-up" style={{ animationDelay: "2s", animationFillMode: "forwards" }}>
          <div className="px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
            빠른 학습 메뉴
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
}
