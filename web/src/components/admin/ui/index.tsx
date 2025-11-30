// ============================================
// VocaVision Admin Dashboard - Common UI Components
// ============================================

'use client';

import React from 'react';

// ---------------------------------------------
// Button Component
// ---------------------------------------------
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-pink-500 text-white hover:bg-pink-600 focus:ring-pink-500 shadow-sm',
    secondary:
      'bg-slate-700 text-white hover:bg-slate-800 focus:ring-slate-500 shadow-sm',
    outline:
      'border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus:ring-slate-500',
    danger:
      'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

// ---------------------------------------------
// Badge Component
// ---------------------------------------------
interface BadgeProps {
  children: React.ReactNode;
  color?: 'gray' | 'pink' | 'green' | 'yellow' | 'blue' | 'red' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'gray',
  size = 'md',
  className = '',
}) => {
  const colors = {
    gray: 'bg-slate-100 text-slate-700',
    pink: 'bg-pink-100 text-pink-700',
    green: 'bg-emerald-100 text-emerald-700',
    yellow: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${colors[color]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

// ---------------------------------------------
// Input Component
// ---------------------------------------------
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2.5 rounded-lg border transition-colors duration-200
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300 focus:border-pink-500 focus:ring-pink-500'
          }
          focus:outline-none focus:ring-2 focus:ring-opacity-20
          placeholder:text-slate-400
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

// ---------------------------------------------
// Select Component
// ---------------------------------------------
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-2.5 rounded-lg border transition-colors duration-200
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300 focus:border-pink-500 focus:ring-pink-500'
          }
          focus:outline-none focus:ring-2 focus:ring-opacity-20
          bg-white
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

// ---------------------------------------------
// Textarea Component
// ---------------------------------------------
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3 rounded-lg border transition-colors duration-200
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300 focus:border-pink-500 focus:ring-pink-500'
          }
          focus:outline-none focus:ring-2 focus:ring-opacity-20
          placeholder:text-slate-400 resize-none
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

// ---------------------------------------------
// Checkbox Component
// ---------------------------------------------
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className = '',
  ...props
}) => {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className={`
          w-4 h-4 rounded border-slate-300 text-pink-500
          focus:ring-pink-500 focus:ring-offset-0
          ${className}
        `}
        {...props}
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
};

// ---------------------------------------------
// Card Component
// ---------------------------------------------
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-xl border border-slate-200 shadow-sm
        ${paddings[padding]} ${className}
      `}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------
// Modal Component
// ---------------------------------------------
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`
            relative w-full ${sizes[size]} bg-white rounded-2xl shadow-xl
            transform transition-all
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------
// Progress Bar Component
// ---------------------------------------------
interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  color?: 'pink' | 'green' | 'blue';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  color = 'pink',
}) => {
  const colors = {
    pink: 'bg-pink-500',
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">진행률</span>
          <span className="font-medium text-slate-900">{progress}%</span>
        </div>
      )}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------
// Empty State Component
// ---------------------------------------------
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 mb-4 text-slate-300">{icon}</div>
      )}
      <h3 className="text-lg font-medium text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-slate-500 mb-4 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
};

// ---------------------------------------------
// Loading Spinner Component
// ---------------------------------------------
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center">
      <svg
        className={`animate-spin text-pink-500 ${sizes[size]}`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
};

// ---------------------------------------------
// Alert Component
// ---------------------------------------------
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  children,
  onClose,
}) => {
  const styles = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'text-emerald-500',
      title: 'text-emerald-800',
      text: 'text-emerald-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      title: 'text-red-800',
      text: 'text-red-700',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-500',
      title: 'text-amber-800',
      text: 'text-amber-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      title: 'text-blue-800',
      text: 'text-blue-700',
    },
  };

  const s = styles[type];

  return (
    <div className={`${s.bg} ${s.border} border rounded-lg p-4`}>
      <div className="flex gap-3">
        <div className={`flex-shrink-0 ${s.icon}`}>
          {type === 'success' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {type === 'error' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {type === 'warning' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {type === 'info' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${s.title}`}>{title}</h3>
          )}
          <div className={`text-sm ${s.text} ${title ? 'mt-1' : ''}`}>
            {children}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${s.icon} hover:opacity-70`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
