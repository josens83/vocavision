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

        // 난이도별 메인 컬러
        level: {
          beginner: {
            DEFAULT: '#50af31',
            light: '#e8f5e4',
            dark: '#3d8a26',
          },
          intermediate: {
            DEFAULT: '#1a8ec1',
            light: '#e3f3fa',
            dark: '#146d96',
          },
          advanced: {
            DEFAULT: '#ec6825',
            light: '#fde9e0',
            dark: '#c4541c',
          },
          expert: {
            DEFAULT: '#a84d98',
            light: '#f5e8f3',
            dark: '#863c79',
          },
        },

        // 학습 유형별 컬러
        study: {
          flashcard: {
            DEFAULT: '#fecc00',
            light: '#fff9db',
            dark: '#d4aa00',
          },
          quiz: {
            DEFAULT: '#ed1c24',
            light: '#fde8e9',
            dark: '#c4161c',
          },
          review: {
            DEFAULT: '#ff6699',
            light: '#ffe8ef',
            dark: '#d4527d',
          },
          vocabulary: {
            DEFAULT: '#1a8ec1',
            light: '#e3f3fa',
            dark: '#146d96',
          },
        },

        // 피드백 컬러
        feedback: {
          correct: '#22c55e',
          incorrect: '#ef4444',
          selected: '#3b82f6',
          hover: '#f1f5f9',
        },

        // 브랜드 컬러
        brand: {
          primary: '#1a8ec1',
          secondary: '#50af31',
          accent: '#fecc00',
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
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
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
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'bounce-soft': 'bounceSoft 0.6s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
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
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(26, 142, 193, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(26, 142, 193, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
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
        'button': 'rgba(0, 0, 0, 0.16) 0 2px 5px 0, rgba(0, 0, 0, 0.12) 0 2px 10px 0',
        'navbar': '0 1px 13px 0 rgba(0,0,0,0.3)',
        'glow-blue': '0 0 30px rgba(26, 142, 193, 0.3)',
        'glow-green': '0 0 30px rgba(80, 175, 49, 0.3)',
        'glow-orange': '0 0 30px rgba(236, 104, 37, 0.3)',
        'glow-purple': '0 0 30px rgba(168, 77, 152, 0.3)',
        'glow-pink': '0 0 30px rgba(255, 102, 153, 0.3)',
        'glow-yellow': '0 0 30px rgba(254, 204, 0, 0.3)',
        'glow-red': '0 0 30px rgba(237, 28, 36, 0.3)',
      },

      // ============================================
      // 배경 이미지
      // ============================================
      backgroundImage: {
        'gradient-main': 'linear-gradient(174.2deg, rgb(255, 252, 248) 7.1%, rgba(240, 246, 238, 1) 67.4%)',
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
