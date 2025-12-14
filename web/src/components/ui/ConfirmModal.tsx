/**
 * Confirmation Modal Component
 * confirm() 대체용 모달 다이얼로그
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

// Confirm Provider
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveRef?.(true);
    setResolveRef(null);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolveRef?.(false);
    setResolveRef(null);
  }, [resolveRef]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <ConfirmModalContent
            options={options}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

// Hook to use confirm
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}

// Modal Content
function ConfirmModalContent({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const typeStyles = {
    danger: {
      icon: '⚠️',
      iconBg: 'bg-red-100',
      confirmBtn: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
      confirmBtn: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    },
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
      confirmBtn: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
  };

  const style = typeStyles[options.type || 'info'];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
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
          aria-labelledby="confirm-title"
        >
          {/* Icon */}
          <div className={`w-12 h-12 ${style.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <span className="text-2xl">{style.icon}</span>
          </div>

          {/* Title */}
          <h2 id="confirm-title" className="text-xl font-bold text-gray-900 text-center mb-2">
            {options.title}
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            {options.message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
            >
              {options.cancelText || '취소'}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 font-medium rounded-xl transition ${style.confirmBtn}`}
            >
              {options.confirmText || '확인'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default ConfirmProvider;
