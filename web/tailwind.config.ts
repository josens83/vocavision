import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ============================================
      // VocaVision 커스텀 컬러 시스템
      // test-english.com 벤치마킹 기반
      // ============================================
      colors: {
        // ============================================
        // VocaVision 브랜드 컬러 (Admin UI)
        // ============================================
        voca: {
          pink: {
            50: '#FFF0F5',
            100: '#FFE0EB',
            200: '#FFC1D6',
            300: '#FFA3C2',
            400: '#FF85AD',
            500: '#FF6699', // Primary Pink
            600: '#E65C8A',
            700: '#CC527A',
            800: '#B3486B',
            900: '#993D5C',
          },
          purple: {
            50: '#F5F3FF',
            100: '#EDE9FE',
            200: '#DDD6FE',
            300: '#C4B5FD',
            400: '#A78BFA',
            500: '#8B5CF6', // Primary Purple
            600: '#7C3AED',
            700: '#6D28D9',
            800: '#5B21B6',
            900: '#4C1D95',
          },
        },

        // CEFR 레벨 컬러 (Admin UI)
        cefr: {
          A1: '#10B981', // green
          A2: '#3B82F6', // blue
          B1: '#8B5CF6', // purple
          B2: '#F59E0B', // amber
          C1: '#EF4444', // red
          C2: '#EC4899', // pink
        },

        // 시험 카테고리 컬러 (Admin UI)
        exam: {
          suneung: '#FF6699',
          teps: '#8B5CF6',
          toefl: '#3B82F6',
          sat: '#10B981',
          ielts: '#F59E0B',
          gre: '#EF4444',
        },

        // 기존 primary 컬러 유지
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },

        // 카테고리별 컬러 (test-english.com 벤치마킹)
        category: {
          grammar: {
            DEFAULT: '#1a8ec1',
            light: '#add6e8',
            bg: '#fafdff',
            border: '#cfe5f3',
          },
          vocabulary: {
            DEFAULT: '#ff6699',
            light: '#fee2eb',
            bg: '#fdfcfd',
            border: '#fee2eb',
          },
          listening: {
            DEFAULT: '#fecc00',
            light: '#ffe89b',
            bg: '#fffef8',
            border: '#fef5c5',
          },
          reading: {
            DEFAULT: '#ed1c24',
            light: '#f8a1a6',
            bg: '#fff9f8',
            border: '#ffd4d6',
          },
          'use-of-english': {
            DEFAULT: '#ec6825',
            light: '#f7c1a8',
            bg: '#fffaf7',
            border: '#ffe4d4',
          },
          writing: {
            DEFAULT: '#a84d98',
            light: '#dfbdda',
            bg: '#fdfcfd',
            border: '#ebdeed',
          },
          exams: {
            DEFAULT: '#50af31',
            light: '#bde1b2',
            bg: '#f9fdf8',
            border: '#d0e9ce',
          },
        },

        // greyblue (네비게이션, 푸터 배경)
        greyblue: '#37424e',

        // 난이도별 메인 컬러 (Duolingo-inspired)
        level: {
          beginner: {
            DEFAULT: '#58CC02',
            light: '#E5F7D3',
            dark: '#46A302',
          },
          intermediate: {
            DEFAULT: '#1CB0F6',
            light: '#D6F0FE',
            dark: '#0099DD',
          },
          advanced: {
            DEFAULT: '#FF9600',
            light: '#FFF0D6',
            dark: '#E68600',
          },
          expert: {
            DEFAULT: '#CE82FF',
            light: '#F4E6FF',
            dark: '#A855F7',
          },
        },

        // 학습 유형별 컬러 (Duolingo-inspired)
        study: {
          flashcard: {
            DEFAULT: '#FFC800',
            light: '#FFF8D6',
            dark: '#E6B400',
          },
          quiz: {
            DEFAULT: '#FF4B4B',
            light: '#FFEBEB',
            dark: '#E63939',
          },
          review: {
            DEFAULT: '#FF86D0',
            light: '#FFF0F8',
            dark: '#E66AB8',
          },
          vocabulary: {
            DEFAULT: '#1CB0F6',
            light: '#D6F0FE',
            dark: '#0099DD',
          },
        },

        // 피드백 컬러 (Duolingo-inspired)
        feedback: {
          correct: '#58CC02',
          incorrect: '#FF4B4B',
          selected: '#1CB0F6',
          hover: '#F7F7F7',
        },

        // 브랜드 컬러 (Duolingo-inspired)
        brand: {
          primary: '#58CC02',
          'primary-dark': '#46A302',
          'primary-light': '#89E219',
          'primary-shadow': '#3C8E00',
          secondary: '#FF9600',
          'secondary-dark': '#E68600',
          'secondary-light': '#FFB84D',
          accent: '#1CB0F6',
          'accent-dark': '#0099DD',
          'accent-light': '#4DC4F9',
          pink: '#FF86D0',
          purple: '#CE82FF',
          teal: '#2ECFCA',
        },

        // 뉴트럴 컬러 (배경, 텍스트)
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc',
          subtle: '#f1f5f9',
          border: '#e2e8f0',
        },

        // 가격 페이지 컬러
        pricing: {
          cta: '#5BC25A',
          background: '#F7FAFF',
          badge: '#37424E',
        },
      },

      // ============================================
      // 타이포그래피
      // ============================================
      fontFamily: {
        sans: ['Pretendard', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'Pretendard', 'system-ui', 'sans-serif'],
        body: ['Pretendard', 'DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3' }],
      },

      // ============================================
      // 애니메이션
      // ============================================
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'scale-up': 'scaleUp 0.2s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-out',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pop': 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleUp: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.05)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(88, 204, 2, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(88, 204, 2, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },

      // ============================================
      // 그림자
      // ============================================
      boxShadow: {
        'card': 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px',
        'card-hover': '0 8px 17px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19)',
        'modal': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'button': 'rgba(0, 0, 0, 0.16) 0 2px 5px 0, rgba(0, 0, 0, 0.12) 0 2px 10px 0',
        'navbar': '0 1px 13px 0 rgba(0,0,0,0.3)',
        // Duolingo-inspired depth shadows
        'btn-primary': '0 4px 0 #3C8E00',
        'btn-secondary': '0 4px 0 #0077AA',
        'btn-cta': '0 4px 0 #CC7700',
        // Glow effects (새 팔레트)
        'glow-green': '0 0 30px rgba(88, 204, 2, 0.3)',
        'glow-blue': '0 0 30px rgba(28, 176, 246, 0.3)',
        'glow-orange': '0 0 30px rgba(255, 150, 0, 0.3)',
        'glow-purple': '0 0 30px rgba(206, 130, 255, 0.3)',
        'glow-pink': '0 0 30px rgba(255, 134, 208, 0.3)',
        'glow-yellow': '0 0 30px rgba(255, 200, 0, 0.3)',
        'glow-red': '0 0 30px rgba(255, 75, 75, 0.3)',
        'glow-teal': '0 0 30px rgba(46, 207, 202, 0.3)',
      },

      // ============================================
      // 배경 이미지
      // ============================================
      backgroundImage: {
        'gradient-main': 'linear-gradient(174.2deg, rgb(255, 252, 248) 7.1%, rgba(240, 246, 238, 1) 67.4%)',
        // Playful gradients
        'gradient-primary': 'linear-gradient(180deg, #58CC02 0%, #46A302 100%)',
        'gradient-secondary': 'linear-gradient(180deg, #1CB0F6 0%, #0099DD 100%)',
        'gradient-cta': 'linear-gradient(180deg, #FF9600 0%, #E68600 100%)',
        'gradient-hero': 'linear-gradient(135deg, #FAFFFE 0%, #E5F7D3 50%, #D6F0FE 100%)',
      },

      // ============================================
      // 테두리 반경
      // ============================================
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}

export default config
