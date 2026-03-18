"use client";

import Link from "next/link";
import { useState, useEffect, ReactNode, useRef } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_STATS } from "@/constants/stats";
import { useAuthStore } from "@/lib/store";
import { getPlanDisplay, isPremiumPlan, canAccessExam, canAccessLevel, isLevelLocked, canAccessContentWithPurchase, canAccessExamWithPurchase } from "@/lib/subscription";
import { useAuthRequired } from "@/components/ui/AuthRequiredModal";
import { useClearAllCache } from "@/hooks/useQueries";
import { useLocale } from "@/hooks/useLocale";

export interface NavItem {
  label: string;
  labelEn?: string;
  href?: string;
  color?: string;
  icon?: ReactNode;
  children?: NavSubItem[];
  /** 로그인 필요 여부 */
  requiresAuth?: boolean;
}

export interface NavSubItem {
  label: string;
  labelEn?: string;
  href: string;
  count?: number;
  badge?: string;
  description?: string;
  descriptionEn?: string;
  icon?: string;
  isDivider?: boolean;
  disabled?: boolean;
  /** 로그인 필요 여부 */
  requiresAuth?: boolean;
}

// Guest용 네비게이션 (시험 카테고리 중심)
export const guestNavigationItems: NavItem[] = [
  {
    label: "수능",
    color: "text-blue-600",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    children: [
      { label: "L1(기초)", href: "/learn?exam=CSAT&level=L1" },
      { label: "L2(중급)", href: "/learn?exam=CSAT&level=L2" },
      { label: "L3(고급)", href: "/learn?exam=CSAT&level=L3" },
    ],
  },
  {
    label: "TEPS",
    color: "text-teal-600",
    children: [
      { label: "L1(기본)", href: "/auth/register?from=teps-l1" },
      { label: "L2(필수)", href: "/auth/register?from=teps-l2" },
    ],
  },
  {
    label: "단어장",
    color: "text-green-600",
    children: [
      { label: "2026 수능기출완전분석", labelEn: "2026 CSAT Analysis", href: "/auth/register?from=csat2026" },
      { label: "EBS 연계어휘", labelEn: "EBS Vocabulary", href: "/auth/register?from=ebs" },
      { label: "TOEFL Core Vocabulary", labelEn: "TOEFL Core Vocabulary", href: "/packages/toefl-complete" },
      { label: "TOEIC Score Booster", labelEn: "TOEIC Score Booster", href: "/packages/toeic-complete" },
      { label: "SAT Advanced Vocabulary", labelEn: "SAT Advanced Vocabulary", href: "/packages/sat-complete" },
      { label: "GRE Verbal Mastery", labelEn: "GRE Verbal Mastery", href: "/packages/gre-complete" },
      { label: "IELTS Academic Mastery", labelEn: "IELTS Academic Mastery", href: "/packages/ielts-complete" },
    ],
  },
  {
    label: "요금제",
    labelEn: "Pricing",
    href: "/pricing",
    color: "text-purple-600",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
];

// 글로벌(영어) Guest용 네비게이션
export const globalGuestNavigationItems: NavItem[] = [
  {
    label: "SAT",
    labelEn: "SAT",
    color: "text-orange-600",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    children: [
      { label: "Starter", labelEn: "Starter", href: "/learn?exam=SAT&level=L1" },
      { label: "Advanced", labelEn: "Advanced", href: "/learn?exam=SAT&level=L2" },
    ],
  },
  {
    label: "GRE",
    labelEn: "GRE",
    color: "text-indigo-600",
    children: [
      { label: "Verbal Core", labelEn: "Verbal Core", href: "/auth/register?from=gre-l1" },
      { label: "Verbal Advanced", labelEn: "Verbal Advanced", href: "/auth/register?from=gre-l2" },
    ],
  },
  {
    label: "Vocab Packs",
    labelEn: "Vocab Packs",
    color: "text-green-600",
    children: [
      { label: "TOEFL Core Vocabulary", labelEn: "TOEFL Core Vocabulary", href: "/packages/toefl-complete" },
      { label: "TOEIC Score Booster", labelEn: "TOEIC Score Booster", href: "/packages/toeic-complete" },
      { label: "IELTS Academic Mastery", labelEn: "IELTS Academic Mastery", href: "/packages/ielts-complete" },
    ],
  },
  {
    label: "Pricing",
    labelEn: "Pricing",
    href: "/pricing",
    color: "text-purple-600",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
];

// 로그인 사용자용 네비게이션 (콘텐츠 중심 - 시험별 접근)
// "사용자는 'TOEIC 단어 공부하러 왔다'지, '플래시카드 하러 왔다'가 아님"
export const authNavigationItems: NavItem[] = [
  {
    label: "수능",
    color: "text-blue-600",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    children: [
      { label: "L1(기초)", href: "/learn?exam=CSAT&level=L1" },
      { label: "L2(중급)", href: "/learn?exam=CSAT&level=L2" },
      { label: "L3(고급)", href: "/learn?exam=CSAT&level=L3" },
    ],
  },
  {
    label: "TEPS",
    color: "text-teal-600",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
    children: [
      { label: "L1(기본)", href: "/learn?exam=TEPS&level=L1" },
      { label: "L2(필수)", href: "/learn?exam=TEPS&level=L2" },
    ],
  },
  {
    label: "단어장",
    color: "text-green-600",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    children: [
      { label: "2026 수능기출완전분석", labelEn: "2026 CSAT Analysis", href: "/dashboard?exam=CSAT_2026" },
      { label: "EBS 연계어휘", labelEn: "EBS Vocabulary", href: "/dashboard?exam=EBS" },
      { label: "TOEFL Core Vocabulary", labelEn: "TOEFL Core Vocabulary", href: "/dashboard?exam=TOEFL" },
      { label: "TOEIC Score Booster", labelEn: "TOEIC Score Booster", href: "/dashboard?exam=TOEIC" },
      { label: "SAT Advanced Vocabulary", labelEn: "SAT Advanced Vocabulary", href: "/dashboard?exam=SAT" },
      { label: "GRE Verbal Mastery", labelEn: "GRE Verbal Mastery", href: "/dashboard?exam=GRE" },
      { label: "IELTS Academic Mastery", labelEn: "IELTS Academic Mastery", href: "/dashboard?exam=IELTS" },
    ],
  },
  {
    label: "내 학습",
    labelEn: "My Learning",
    color: "text-purple-600",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    children: [
      { label: "대시보드", labelEn: "Dashboard", href: "/dashboard", description: "오늘의 학습 현황", descriptionEn: "Today's learning overview" },
      { label: "복습 노트", labelEn: "Review", href: "/review", description: "틀린 단어 모아보기", descriptionEn: "Words to review" },
      { label: "단어 찾기", labelEn: "Words", href: "/words", description: "단어 검색·탐색", descriptionEn: "Search vocabulary" },
      { label: "학습 통계", labelEn: "Statistics", href: "/statistics", description: "상세 학습 분석", descriptionEn: "Learning analytics" },
      { label: "divider", href: "#", isDivider: true },
      { label: "MY", href: "/my", description: "계정 설정", descriptionEn: "Account settings", icon: "👤" },
    ],
  },
  {
    label: "요금제",
    labelEn: "Pricing",
    href: "/pricing",
    color: "text-orange-500",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
];

// 글로벌(영어) 로그인 사용자용 네비게이션
export const globalAuthNavigationItems: NavItem[] = [
  {
    label: "SAT",
    labelEn: "SAT",
    color: "text-orange-600",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    children: [
      { label: "Starter", labelEn: "Starter", href: "/dashboard?exam=SAT&level=L1" },
      { label: "Advanced", labelEn: "Advanced", href: "/dashboard?exam=SAT&level=L2" },
    ],
  },
  {
    label: "GRE",
    labelEn: "GRE",
    color: "text-indigo-600",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
    children: [
      { label: "Verbal Core", labelEn: "Verbal Core", href: "/dashboard?exam=GRE&level=L1" },
      { label: "Verbal Advanced", labelEn: "Verbal Advanced", href: "/dashboard?exam=GRE&level=L2" },
    ],
  },
  {
    label: "TOEFL",
    labelEn: "TOEFL",
    color: "text-blue-600",
    children: [
      { label: "Core", labelEn: "Core", href: "/dashboard?exam=TOEFL&level=L1" },
      { label: "Advanced", labelEn: "Advanced", href: "/dashboard?exam=TOEFL&level=L2" },
    ],
  },
  {
    label: "IELTS",
    labelEn: "IELTS",
    color: "text-sky-600",
    children: [
      { label: "Foundation", labelEn: "Foundation", href: "/dashboard?exam=IELTS&level=L1" },
      { label: "Academic", labelEn: "Academic", href: "/dashboard?exam=IELTS&level=L2" },
    ],
  },
  {
    label: "My Learning",
    labelEn: "My Learning",
    color: "text-purple-600",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    children: [
      { label: "Dashboard", labelEn: "Dashboard", href: "/dashboard", description: "Today's learning overview" },
      { label: "Review", labelEn: "Review", href: "/review", description: "Words to review" },
      { label: "Words", labelEn: "Words", href: "/words", description: "Search vocabulary" },
      { label: "Statistics", labelEn: "Statistics", href: "/statistics", description: "Learning analytics" },
      { label: "divider", href: "#", isDivider: true },
      { label: "MY", labelEn: "MY", href: "/my", description: "Account settings", icon: "👤" },
    ],
  },
  {
    label: "Pricing",
    labelEn: "Pricing",
    href: "/pricing",
    color: "text-orange-500",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
];

// 기본 export (하위 호환성)
export const navigationItems = authNavigationItems;

// 권한별 라우팅 함수
// subscription.ts의 유틸리티 사용
function getPermissionBasedHref(
  originalHref: string,
  user: any,
  parentLabel: string
): string {
  // 비로그인 → 회원가입
  if (!user) {
    return '/auth/register';
  }

  // URL에서 exam과 level 파싱
  const url = new URL(originalHref, 'http://dummy');
  const exam = url.searchParams.get('exam');
  const level = url.searchParams.get('level');

  if (!exam) {
    return originalHref; // exam이 없으면 원본 반환
  }

  // exam만 있고 level이 없는 경우 (단어장: CSAT_2026, EBS)
  if (!level) {
    if (!canAccessExamWithPurchase(user, exam)) {
      return '/pricing'; // 접근 불가 → 요금제 페이지
    }
    return `/dashboard?exam=${exam}`; // 접근 가능 → 대시보드
  }

  // 잠금 상태면 적절한 업그레이드 페이지로 이동
  if (isLevelLocked(user, exam, level)) {
    if (exam === 'TEPS') {
      return '/pricing'; // TEPS는 프리미엄 필요
    }
    return '/pricing'; // 수능 L2/L3는 베이직 이상 필요
  }

  // 접근 가능하면 대시보드로 이동
  return `/dashboard?exam=${exam}&level=${level}`;
}

// 권한 상태 표시용 (잠금 아이콘 여부)
// canAccessContentWithPurchase: 프리미엄 + 단품 구매 모두 고려
function isMenuLocked(
  originalHref: string,
  user: any
): boolean {
  if (!user) return true;

  const url = new URL(originalHref, 'http://dummy');
  const exam = url.searchParams.get('exam');
  const level = url.searchParams.get('level');

  if (!exam) return false;

  // exam만 있고 level이 없는 경우 (단어장: CSAT_2026, EBS)
  if (!level) {
    return !canAccessExamWithPurchase(user, exam);
  }

  return !canAccessContentWithPurchase(user, exam, level);
}

interface NavDropdownProps {
  item: NavItem;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  user?: any;
  locale?: 'ko' | 'en';
}

function NavDropdown({ item, isOpen, onMouseEnter, onMouseLeave, user, locale = 'ko' }: NavDropdownProps) {
  const router = useRouter();

  const handleItemClick = (e: React.MouseEvent, child: NavSubItem) => {
    e.preventDefault();
    const targetHref = getPermissionBasedHref(child.href, user, item.label);
    router.push(targetHref);
  };

  return (
    <div className="relative nav-item" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button className={`nav-link flex items-center gap-2 whitespace-nowrap ${item.color || ""}`}>
        {item.icon}
        <span>{(locale === 'en' && item.labelEn) || item.label}</span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`dropdown py-2 ${isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"}`}>
        {item.children?.map((child, index) => {
          const locked = isMenuLocked(child.href, user);

          return child.isDivider ? (
            <div key={`divider-${index}`} className="border-t border-slate-200 my-2" />
          ) : (
            <button
              key={`${item.label}-${child.label}`}
              onClick={(e) => handleItemClick(e, child)}
              className="dropdown-item group w-full text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {child.icon && <span>{child.icon}</span>}
                  <span className="font-medium">{(locale === 'en' && child.labelEn) || child.label}</span>
                  {child.badge && <span className="px-1.5 py-0.5 text-xs font-bold bg-study-flashcard text-slate-900 rounded">{child.badge}</span>}
                  {locked && (
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
                {child.description && <p className="text-xs text-slate-400 mt-0.5">{(locale === 'en' && child.descriptionEn) || child.description}</p>}
              </div>
              {child.count !== undefined && <span className="text-sm text-slate-400 group-hover:text-slate-600">{child.count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface NavLinkProps {
  item: NavItem;
  isAuthenticated: boolean;
  onAuthRequired?: (label: string) => void;
  locale?: 'ko' | 'en';
}

function NavLink({ item, isAuthenticated, onAuthRequired, locale = 'ko' }: NavLinkProps) {
  const showLock = item.requiresAuth && !isAuthenticated;

  // Guest가 로그인 필요 항목 클릭 시
  if (showLock) {
    return (
      <button
        onClick={() => onAuthRequired?.(item.label)}
        className={`nav-link flex items-center gap-2 whitespace-nowrap ${item.color || ""} opacity-75 hover:opacity-100`}
      >
        {item.icon}
        <span>{item.label}</span>
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </button>
    );
  }

  return (
    <Link href={item.href || "#"} className={`nav-link flex items-center gap-2 whitespace-nowrap ${item.color || ""}`}>
      {item.icon}
      <span>{(locale === 'en' && item.labelEn) || item.label}</span>
    </Link>
  );
}

// 검색 모달 컴포넌트
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      const stored = localStorage.getItem("recentSearches");
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const searches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    localStorage.setItem("recentSearches", JSON.stringify(searches));
    router.push(`/words?search=${encodeURIComponent(searchQuery)}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch(query);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="단어 또는 뜻을 검색하세요..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto">
            {recentSearches.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">최근 검색</span>
                  <button onClick={() => { setRecentSearches([]); localStorage.removeItem("recentSearches"); }} className="text-xs text-slate-400 hover:text-slate-600">
                    전체 삭제
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, i) => (
                    <button key={i} onClick={() => handleSearch(search)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-700 transition-colors">
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-xs font-medium text-slate-500 mb-2 block">빠른 바로가기</span>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/words?level=L1" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">L1</span>
                  <div><div className="text-sm font-medium text-slate-900">기초 단어</div><div className="text-xs text-slate-500">{PLATFORM_STATS.levels.L1.toLocaleString()}개</div></div>
                </Link>
                <Link href="/words?level=L2" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">L2</span>
                  <div><div className="text-sm font-medium text-slate-900">중급 단어</div><div className="text-xs text-slate-500">{PLATFORM_STATS.levels.L2.toLocaleString()}개</div></div>
                </Link>
                <Link href="/words?level=L3" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">L3</span>
                  <div><div className="text-sm font-medium text-slate-900">고급 단어</div><div className="text-xs text-slate-500">{PLATFORM_STATS.levels.L3.toLocaleString()}개</div></div>
                </Link>
                <Link href="/learn?exam=CSAT&level=L1&demo=true" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">🎴</span>
                  <div><div className="text-sm font-medium text-slate-900">플래시카드</div><div className="text-xs text-slate-500">학습 시작</div></div>
                </Link>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Enter로 검색</span>
            <span>ESC로 닫기</span>
          </div>
        </div>
      </div>
    </>
  );
}

// 헤더 스트릭 표시 컴포넌트
interface HeaderStreakProps {
  streak: number;
}

function HeaderStreak({ streak }: HeaderStreakProps) {
  if (streak <= 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-red-100 rounded-full">
      <span className="text-lg">🔥</span>
      <span className="text-sm font-bold text-orange-600">{streak}</span>
    </div>
  );
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  isAuthenticated: boolean;
  onAuthRequired?: (label: string) => void;
  user?: any;
  onLogout?: () => void;
}

function MobileMenu({ isOpen, onClose, items, isAuthenticated, onAuthRequired, user, onLogout }: MobileMenuProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.setAttribute('data-menu-open', 'true');
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.removeAttribute('data-menu-open');
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY, 10) * -1);
      }
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.removeAttribute('data-menu-open');
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY, 10) * -1);
      }
    };
  }, [isOpen]);

  const handleItemClick = (item: NavItem) => {
    if (item.requiresAuth && !isAuthenticated) {
      onClose();
      onAuthRequired?.(item.label);
    }
  };

  const handleChildClick = (child: NavSubItem, parentLabel: string) => {
    onClose();
    const targetHref = getPermissionBasedHref(child.href, user, parentLabel);
    router.push(targetHref);
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-[9999] shadow-2xl transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-surface-border">
          <span className="font-display font-bold text-xl text-gradient">VocaVision AI</span>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="p-4 overflow-y-auto h-[calc(100%-80px)]">
          {items.map((item) => {
            const showLock = item.requiresAuth && !isAuthenticated;

            return (
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
                        {item.children.map((child, index) => {
                          const locked = isMenuLocked(child.href, user);

                          return child.isDivider ? (
                            <div key={`divider-${index}`} className="border-t border-slate-200 my-2" />
                          ) : (
                            <button
                              key={`${item.label}-${child.label}`}
                              onClick={() => handleChildClick(child, item.label)}
                              className="w-full flex items-center justify-between p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 text-left"
                            >
                              <div className="flex items-center gap-2">
                                {child.icon && <span>{child.icon}</span>}
                                <span className="text-sm font-medium">{child.label}</span>
                                {child.badge && <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-study-flashcard text-slate-900 rounded">{child.badge}</span>}
                                {locked && (
                                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                )}
                              </div>
                              {child.count !== undefined && <span className="text-xs text-slate-400">{child.count}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : showLock ? (
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors ${item.color || "text-slate-700"} opacity-75`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                    <svg className="w-4 h-4 text-slate-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </button>
                ) : item.href === "#" ? (
                  // "준비중" 항목 (모바일)
                  <div className="flex items-center gap-3 p-3 rounded-lg text-slate-400">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full ml-auto">준비중</span>
                  </div>
                ) : (
                  <Link href={item.href || "#"} onClick={onClose} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors ${item.color || "text-slate-700"}`}>
                    {item.icon}<span className="font-medium">{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}

          {/* 로그아웃 — 메뉴 아이템 바로 아래 */}
          {isAuthenticated && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => { onClose(); onLogout?.(); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">로그아웃</span>
              </button>
            </div>
          )}
        </nav>

        {!isAuthenticated && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-border bg-white">
            <Link href="/auth/login" onClick={onClose} className="btn btn-primary w-full justify-center">
              로그인 / 회원가입
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export default function Navigation() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();

  const { user, logout, _hasHydrated } = useAuthStore();
  const { showAuthRequired } = useAuthRequired();
  const clearAllCache = useClearAllCache();
  const isAuthenticated = !!user;

  // locale 기반 메뉴 선택
  const currentGuestItems = locale === 'en' ? globalGuestNavigationItems : guestNavigationItems;
  const currentAuthItems = locale === 'en' ? globalAuthNavigationItems : authNavigationItems;

  // Mock streak - 실제로는 user 객체에서 가져와야 함
  const userStreak = (user as any)?.streak || 0;

  // 유저 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Guest가 로그인 필요 메뉴 클릭 시
  const handleAuthRequired = (label: string) => {
    showAuthRequired({
      title: `${label} 기능`,
      message: `${label} 기능을 이용하려면 로그인이 필요합니다.`,
      features: [
        '학습 진행 상황 저장',
        '개인화된 복습 일정',
        '상세 학습 통계',
      ],
    });
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const handleLogout = () => {
    clearAllCache();
    logout();
    window.location.href = '/';
  };

  return (
    <header className={`sticky top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white"}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
              <span className="text-white font-display font-bold text-xl">V</span>
            </div>
            <span className="font-display font-bold text-xl">
              <span className="text-gradient">Voca</span><span className="text-slate-700">Vision</span><span className="text-slate-400 ml-1">AI</span>
            </span>
            {/* 태그라인 - 데스크톱만 표시 */}
            <div className="hidden lg:flex items-center gap-2 ml-1 pl-3 border-l border-gray-300">
              <span className="text-xs text-gray-500 italic">Vocabulary, Visualized.</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-4">
            {(isAuthenticated ? currentAuthItems : currentGuestItems).map((item) => (
              item.children ? (
                <NavDropdown key={item.label} item={item} isOpen={openDropdown === item.label} onMouseEnter={() => setOpenDropdown(item.label)} onMouseLeave={() => setOpenDropdown(null)} user={user} locale={locale} />
              ) : item.href === "#" ? (
                // "준비중" 항목 (TEPS, TOEFL 등)
                <button
                  key={item.label}
                  className="nav-link flex items-center gap-1.5 text-slate-400 cursor-default whitespace-nowrap"
                  onClick={() => {}}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">준비중</span>
                </button>
              ) : (
                <NavLink
                  key={item.label}
                  item={item}
                  isAuthenticated={isAuthenticated}
                  onAuthRequired={handleAuthRequired}
                  locale={locale}
                />
              )
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* 로그인 시 스트릭 표시 */}
            {isAuthenticated && <HeaderStreak streak={userStreak} />}

            {/* 로그인/유저 정보 */}
            {!_hasHydrated ? (
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse hidden sm:block" />
            ) : isAuthenticated && user ? (
              <div className="hidden sm:block relative" ref={userMenuRef}>
                {/* 유저 아바타 버튼 */}
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || '사용자'}
                      className="w-8 h-8 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                      <span className="text-brand-primary font-medium text-sm">
                        {user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700 hidden md:block max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 드롭다운 메뉴 */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                    {/* 유저 정보 헤더 */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {(() => {
                        const planDisplay = getPlanDisplay(user);
                        return (
                          <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${planDisplay.bgColor} ${planDisplay.textColor}`}>
                            {planDisplay.text}
                          </span>
                        );
                      })()}
                    </div>

                    {/* 메뉴 항목 */}
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        대시보드
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        내 정보
                      </Link>
                      <Link
                        href="/statistics"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        학습 통계
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        설정
                      </Link>
                    </div>

                    {/* 구독/요금제 - 프리미엄(YEARLY/FAMILY)이 아닌 경우 표시 */}
                    {!isPremiumPlan(user) && (
                      <div className="border-t border-slate-100 py-1">
                        <Link
                          href="/pricing"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-primary font-medium hover:bg-brand-primary/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          {(user as any).subscriptionPlan === 'MONTHLY' ? '프리미엄으로 업그레이드' : '플랜 업그레이드'}
                        </Link>
                      </div>
                    )}

                    {/* 로그아웃 */}
                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="btn btn-primary py-2 hidden sm:flex">시작하기</Link>
            )}

            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={isAuthenticated ? currentAuthItems : currentGuestItems}
        isAuthenticated={isAuthenticated}
        onAuthRequired={handleAuthRequired}
        user={user}
        onLogout={handleLogout}
      />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
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
