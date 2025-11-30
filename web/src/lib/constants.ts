/**
 * VocaVision Constants
 * 앱 전체에서 사용되는 상수 정의
 */

import { Category, Level } from './colors';

// ============================================
// 레벨 라벨
// ============================================

export const levelLabels: Record<Level, string> = {
  A1: 'Elementary',
  A2: 'Pre-intermediate',
  B1: 'Intermediate',
  'B1+': 'Upper-intermediate',
  B2: 'Pre-advanced',
  C1: 'Advanced',
};

// ============================================
// 네비게이션 메뉴 아이템
// ============================================

export interface NavMenuItem {
  label: string;
  category: Category;
  levels: Level[];
}

export const navMenuItems: NavMenuItem[] = [
  {
    label: 'Grammar',
    category: 'grammar',
    levels: ['A1', 'A2', 'B1', 'B1+', 'B2', 'C1'],
  },
  {
    label: 'Vocabulary',
    category: 'vocabulary',
    levels: ['A1', 'A2', 'B1', 'B1+', 'B2', 'C1'],
  },
  {
    label: 'Listening',
    category: 'listening',
    levels: ['A1', 'A2', 'B1', 'B1+', 'B2', 'C1'],
  },
  {
    label: 'Reading',
    category: 'reading',
    levels: ['A1', 'A2', 'B1', 'B1+', 'B2', 'C1'],
  },
  {
    label: 'Use of English',
    category: 'useOfEnglish',
    levels: ['A1', 'A2', 'B1', 'B1+', 'B2'],
  },
  {
    label: 'Writing',
    category: 'writing',
    levels: ['A1', 'A2', 'B1', 'B1+', 'B2', 'C1'],
  },
  {
    label: 'Exams',
    category: 'exams',
    levels: ['A2', 'B1', 'B2'],
  },
];

// ============================================
// 소셜 미디어 링크
// ============================================

export const socialLinks = {
  facebook: 'https://facebook.com/vocavision',
  twitter: 'https://twitter.com/vocavision',
  instagram: 'https://instagram.com/vocavision',
  youtube: 'https://youtube.com/vocavision',
};

// ============================================
// 소셜 공유 플랫폼
// ============================================

export const socialPlatforms = [
  { name: 'facebook', color: '#3b5998' },
  { name: 'twitter', color: '#111111' },
  { name: 'linkedin', color: '#0077b5' },
  { name: 'whatsapp', color: '#25D366' },
  { name: 'email', color: '#777777' },
  { name: 'kakao', color: '#FEE500' },
] as const;

// ============================================
// 탭 설정
// ============================================

export const lessonTabs = [
  { id: 'exercises' as const, label: 'Exercises' },
  { id: 'explanation' as const, label: 'Explanation' },
  { id: 'downloads' as const, label: 'Downloads' },
];

// ============================================
// 퀴즈 타입 설정
// ============================================

export const quizTypes = {
  dropdown: {
    label: 'Select',
    description: '드롭다운에서 정답 선택',
  },
  'multiple-choice': {
    label: 'Multiple Choice',
    description: '4지선다 중 정답 선택',
  },
  'fill-in-blank': {
    label: 'Fill in the blank',
    description: '빈칸에 알맞은 단어 입력',
  },
  matching: {
    label: 'Matching',
    description: '단어와 뜻 연결',
  },
} as const;

// ============================================
// 페이지당 문항 수
// ============================================

export const QUESTIONS_PER_PAGE = 10;

// ============================================
// 애니메이션 지속 시간
// ============================================

export const animationDurations = {
  fast: 150,
  normal: 300,
  slow: 550,
} as const;

// ============================================
// 미디어 쿼리 브레이크포인트 (JS용)
// ============================================

export const mediaBreakpoints = {
  xs: 360,
  sm: 500,
  md: 600,
  lg: 900,
  xl: 1000,
  '2xl': 1260,
  '3xl': 1400,
} as const;

// ============================================
// 푸터 링크
// ============================================

export const footerLinks = {
  levels: [
    { level: 'A1' as Level, href: '/level/a1' },
    { level: 'A2' as Level, href: '/level/a2' },
    { level: 'B1' as Level, href: '/level/b1' },
    { level: 'B1+' as Level, href: '/level/b1-plus' },
    { level: 'B2' as Level, href: '/level/b2' },
  ],
  info: [
    { label: 'About us', href: '/about' },
    { label: 'Terms of Use', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
  contact: [
    { label: 'Contact us', href: '/contact' },
  ],
};
