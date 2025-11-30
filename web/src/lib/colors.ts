/**
 * VocaVision Design Tokens
 * test-english.com 벤치마킹 기반 컬러 시스템
 */

// ============================================
// 카테고리별 Primary 컬러
// ============================================

export const categoryColors = {
  grammar: {
    primary: '#1a8ec1',
    light: '#add6e8',
    bg: '#fafdff',
    border: '#cfe5f3',
  },
  vocabulary: {
    primary: '#ff6699',
    light: '#fee2eb',
    bg: '#fdfcfd',
    border: '#fee2eb',
  },
  listening: {
    primary: '#fecc00',
    light: '#ffe89b',
    bg: '#fffef8',
    border: '#fef5c5',
  },
  reading: {
    primary: '#ed1c24',
    light: '#f8a1a6',
    bg: '#fff9f8',
    border: '#ffd4d6',
  },
  useOfEnglish: {
    primary: '#ec6825',
    light: '#f7c1a8',
    bg: '#fffaf7',
    border: '#ffe4d4',
  },
  writing: {
    primary: '#a84d98',
    light: '#dfbdda',
    bg: '#fdfcfd',
    border: '#ebdeed',
  },
  exams: {
    primary: '#50af31',
    light: '#bde1b2',
    bg: '#f9fdf8',
    border: '#d0e9ce',
  },
} as const;

// ============================================
// 공통 컬러 팔레트
// ============================================

export const baseColors = {
  // 브랜드 컬러
  brand: {
    primary: '#50af31',
    primaryLight: '#bde1b2',
    secondary: '#1a8ec1',
    accent: '#fecc00',
  },

  // 시맨틱 컬러
  semantic: {
    success: '#50af31',
    successLight: '#d0e9ce',
    error: '#ed1c24',
    errorLight: '#fff9f8',
    warning: '#fecc00',
    warningLight: '#ffe89b',
    info: '#1a8ec1',
    infoLight: '#add6e8',
  },

  // 중립 컬러
  neutral: {
    white: '#ffffff',
    black: '#000000',
    grayDark: '#353535',
    gray: '#4d4d4d',
    grayMid: '#838383',
    grayLight: '#f5f5f5',
    greyblue: '#37424e',
  },

  // 배경
  background: {
    main: 'linear-gradient(174.2deg, rgb(255, 252, 248) 7.1%, rgba(240, 246, 238, 1) 67.4%)',
    card: '#ffffff',
    section: '#fcfcfc',
  },
} as const;

// ============================================
// 레벨별 컬러 매핑
// ============================================

export const levelColors = {
  A1: { label: 'Elementary', color: '#50af31' },
  A2: { label: 'Pre-intermediate', color: '#50af31' },
  B1: { label: 'Intermediate', color: '#1a8ec1' },
  'B1+': { label: 'Upper-intermediate', color: '#1a8ec1' },
  B2: { label: 'Pre-advanced', color: '#ec6825' },
  C1: { label: 'Advanced', color: '#a84d98' },
} as const;

// ============================================
// 그림자 및 효과 시스템
// ============================================

export const shadows = {
  card: 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px',
  cardHover: '0 8px 17px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19)',
  button: 'rgba(0, 0, 0, 0.16) 0 2px 5px 0, rgba(0, 0, 0, 0.12) 0 2px 10px 0',
  navbar: '0 1px 13px 0 rgba(0,0,0,0.3)',
};

export const transitions = {
  fast: 'all 0.15s ease-in-out',
  normal: 'all 0.3s ease-in-out',
  slow: 'all 0.55s ease-in-out',
};

export const borderRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '15px',
  full: '9999px',
};

// ============================================
// 스페이싱 시스템
// ============================================

export const spacing = {
  container: {
    sm: '960px',
    md: '1200px',
    lg: '1400px',
    xl: '1500px',
    xxl: '1600px',
  },
  section: {
    mobile: '1em',
    tablet: '2em',
    desktop: '3em',
  },
  card: {
    sm: '0.4em',
    md: '1em',
    lg: '1.2em',
  },
  grid: {
    sm: '8px',
    md: '12px',
    lg: '24px',
  },
};

// ============================================
// 반응형 브레이크포인트
// ============================================

export const breakpoints = {
  xs: '360px',
  sm: '500px',
  md: '600px',
  lg: '900px',
  xl: '1000px',
  '2xl': '1260px',
  '3xl': '1400px',
};

// ============================================
// 뱃지 스타일
// ============================================

export const badgeStyles = {
  filled: {
    width: '1.75em',
    height: '1.75em',
    borderRadius: '50%',
    fontWeight: 600,
    fontFamily: 'Arial',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    width: '1.6em',
    height: '1.6em',
    borderRadius: '50%',
    borderWidth: '2px',
    fontWeight: 700,
    fontFamily: 'Arial',
    backgroundColor: 'transparent',
  },
};

// ============================================
// 텍스트 스타일
// ============================================

export const textStyles = {
  // 페이지 타이틀 (헤더 배너)
  pageTitle: {
    fontSize: '1.2em',
    fontSizeMd: '1.4em',
    fontSizeLg: '1.8em',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: '#ffffff',
  },
  // 섹션 타이틀
  sectionTitle: {
    fontSize: '1.6em',
    fontWeight: 500,
    lineHeight: 1.3,
  },
  // 서브 타이틀
  subTitle: {
    fontSize: '1.4em',
    fontWeight: 500,
    marginBlock: '30px auto',
  },
  // 본문
  body: {
    fontSize: '17px',
    fontWeight: 300,
    lineHeight: 1.7,
    color: '#4d4d4d',
  },
  // 퀴즈 문항
  quizText: {
    fontSize: '17px',
    fontWeight: 300,
    lineHeight: 2,
  },
  // 인스트럭션 박스
  instruction: {
    fontSize: '16px',
    fontWeight: 500,
    backgroundColor: '#ECEFF3',
    padding: '1em',
    borderRadius: '8px',
    border: '1px solid #CCC',
  },
  // 브레드크럼
  breadcrumb: {
    fontSize: '0.9em',
    fontWeight: 400,
  },
};

// ============================================
// 카테고리 아이콘 경로
// ============================================

export const categoryIcons = {
  grammar: '/icons/ico-grammar.png',
  vocabulary: '/icons/ico-vocabulary.png',
  listening: '/icons/ico-listening.png',
  reading: '/icons/ico-reading.png',
  useOfEnglish: '/icons/ico-useof.png',
  writing: '/icons/ico-writing.png',
  exams: '/icons/ico-exams.png',
};

// ============================================
// 헬퍼 함수
// ============================================

export type Category = keyof typeof categoryColors;
export type Level = keyof typeof levelColors;

export function getCategoryColor(category: Category) {
  return categoryColors[category];
}

export function getLevelColor(level: Level) {
  return levelColors[level];
}

export function getCategoryIcon(category: Category) {
  return categoryIcons[category];
}
