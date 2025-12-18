/**
 * Auth Required Modal Component
 * 로그인이 필요한 기능 접근 시 표시되는 모달
 * GPT 권장: 리디렉션 대신 모달로 안내하여 UX 개선
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthRequiredOptions {
  /** 모달 제목 */
  title?: string;
  /** 안내 메시지 */
  message?: string;
  /** 로그인 후 돌아올 URL */
  returnTo?: string;
  /** 기능 설명 (로그인하면 가능한 것들) */
  features?: string[];
}

interface AuthRequiredContextType {
  /** 로그인 필요 모달 표시 */
  showAuthRequired: (options?: AuthRequiredOptions) => void;
}

const AuthRequiredContext = createContext<AuthRequiredContextType | null>(null);

// Provider
export function AuthRequiredProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AuthRequiredOptions>({});

  const showAuthRequired = useCallback((opts?: AuthRequiredOptions) => {
    setOptions(opts || {});
    setIsOpen(true);
  }, []);

  const handleLogin = useCallback(() => {
    setIsOpen(false);
    const returnTo = options.returnTo || window.location.pathname;
    // next 파라미터로 통일 (로그인 페이지에서 읽음)
    router.push(`/auth/login?next=${encodeURIComponent(returnTo)}`);
  }, [options.returnTo, router]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AuthRequiredContext.Provider value={{ showAuthRequired }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <AuthRequiredModalContent
            options={options}
            onLogin={handleLogin}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </AuthRequiredContext.Provider>
  );
}

// Hook
export function useAuthRequired() {
  const context = useContext(AuthRequiredContext);
  if (!context) {
    throw new Error('useAuthRequired must be used within an AuthRequiredProvider');
  }
  return context;
}

// Modal Content
function AuthRequiredModalContent({
  options,
  onLogin,
  onClose,
}: {
  options: AuthRequiredOptions;
  onLogin: () => void;
  onClose: () => void;
}) {
  const defaultFeatures = [
    '학습 기록 저장',
    '복습 추천 받기',
    '학습 통계 확인',
  ];

  const features = options.features || defaultFeatures;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[110]"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-[111] flex items-center justify-center p-4"
      >
        <div
          className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-required-title"
        >
          {/* Icon */}
          <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>

          {/* Title */}
          <h2 id="auth-required-title" className="text-xl font-bold text-gray-900 text-center mb-2">
            {options.title || '로그인이 필요해요'}
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-center mb-4">
            {options.message || '이 기능을 사용하려면 로그인해 주세요.'}
          </p>

          {/* Features */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">로그인하면:</p>
            <ul className="space-y-1.5">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onLogin}
              className="w-full px-4 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-xl transition"
            >
              로그인하기
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 text-gray-500 hover:text-gray-700 font-medium transition"
            >
              데모 계속하기
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default AuthRequiredProvider;
