"use client";

import Link from "next/link";
import { useState, useEffect, ReactNode } from "react";

export interface NavItem {
  label: string;
  href?: string;
  color?: string;
  icon?: ReactNode;
  children?: NavSubItem[];
}

export interface NavSubItem {
  label: string;
  href: string;
  count?: number;
  badge?: string;
  description?: string;
}

export const navigationItems: NavItem[] = [
  {
    label: "시험별 학습",
    color: "text-level-intermediate",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    children: [
      { label: "수능 (CSAT)", href: "/courses/csat", description: "수능 필수 어휘", badge: "학습 가능" },
      { label: "SAT", href: "/courses/sat", description: "미국 대학입학시험" },
      { label: "TOEFL", href: "/courses/toefl", description: "학술 영어 능력시험" },
      { label: "TOEIC", href: "/courses/toeic", description: "국제 의사소통 영어" },
      { label: "TEPS", href: "/courses/teps", description: "서울대 영어 능력시험" },
    ],
  },
  {
    label: "플래시카드",
    href: "/flashcards",
    color: "text-study-flashcard-dark",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  {
    label: "퀴즈",
    color: "text-study-quiz-dark",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    children: [
      { label: "객관식 퀴즈", href: "/quiz/multiple", description: "4지선다형 문제" },
      { label: "빈칸 채우기", href: "/quiz/fill", description: "문장 완성 문제" },
      { label: "매칭 게임", href: "/quiz/match", description: "단어-뜻 연결" },
      { label: "타임 어택", href: "/quiz/timed", badge: "🔥", description: "시간 제한 모드" },
    ],
  },
  {
    label: "복습",
    href: "/review",
    color: "text-study-review-dark",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  },
  {
    label: "통계",
    href: "/stats",
    color: "text-level-advanced",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
];

interface NavDropdownProps {
  item: NavItem;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function NavDropdown({ item, isOpen, onMouseEnter, onMouseLeave }: NavDropdownProps) {
  return (
    <div className="relative nav-item" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button className={`nav-link flex items-center gap-2 ${item.color || ""}`}>
        {item.icon}
        <span>{item.label}</span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`dropdown py-2 ${isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"}`}>
        {item.children?.map((child) => (
          <Link key={child.href} href={child.href} className="dropdown-item group">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{child.label}</span>
                {child.badge && <span className="px-1.5 py-0.5 text-xs font-bold bg-study-flashcard text-slate-900 rounded">{child.badge}</span>}
              </div>
              {child.description && <p className="text-xs text-slate-400 mt-0.5">{child.description}</p>}
            </div>
            {child.count !== undefined && <span className="text-sm text-slate-400 group-hover:text-slate-600">{child.count}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

function NavLink({ item }: { item: NavItem }) {
  return (
    <Link href={item.href || "#"} className={`nav-link flex items-center gap-2 ${item.color || ""}`}>
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}

function MobileMenu({ isOpen, onClose, items }: MobileMenuProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <span className="font-display font-bold text-xl text-gradient">VocaVision</span>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="p-4 overflow-y-auto h-[calc(100%-80px)]">
          {items.map((item) => (
            <div key={item.label} className="mb-2">
              {item.children ? (
                <>
                  <button onClick={() => setExpandedItem(expandedItem === item.label ? null : item.label)} className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors ${item.color || "text-slate-700"}`}>
                    <span className="flex items-center gap-3">{item.icon}<span className="font-medium">{item.label}</span></span>
                    <svg className={`w-5 h-5 transition-transform ${expandedItem === item.label ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${expandedItem === item.label ? "max-h-96" : "max-h-0"}`}>
                    <div className="pl-12 py-2 space-y-1">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href} onClick={onClose} className="flex items-center justify-between p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50">
                          <div>
                            <span className="text-sm font-medium">{child.label}</span>
                            {child.badge && <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-study-flashcard text-slate-900 rounded">{child.badge}</span>}
                          </div>
                          {child.count !== undefined && <span className="text-xs text-slate-400">{child.count}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link href={item.href || "#"} onClick={onClose} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors ${item.color || "text-slate-700"}`}>
                  {item.icon}<span className="font-medium">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-border bg-white">
          <Link href="/study" onClick={onClose} className="btn btn-primary w-full justify-center">학습 시작하기</Link>
        </div>
      </div>
    </>
  );
}

export default function Navigation() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
              <span className="text-white font-display font-bold text-xl">V</span>
            </div>
            <span className="font-display font-bold text-xl hidden sm:block">
              <span className="text-gradient">Voca</span><span className="text-slate-700">Vision</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => (
              item.children ? (
                <NavDropdown key={item.label} item={item} isOpen={openDropdown === item.label} onMouseEnter={() => setOpenDropdown(item.label)} onMouseLeave={() => setOpenDropdown(null)} />
              ) : (
                <NavLink key={item.label} item={item} />
              )
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </button>
            <Link href="/auth/login" className="btn btn-primary py-2 hidden sm:flex">시작하기</Link>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </div>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} items={navigationItems} />
    </header>
  );
}

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) setProgress((scrollTop / scrollHeight) * 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="scroll-progress">
      <div className="scroll-progress__bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
