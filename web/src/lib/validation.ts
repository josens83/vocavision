/**
 * Form Validation Utilities
 * 폼 입력값 유효성 검사 유틸리티
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FieldValidation {
  [key: string]: ValidationResult;
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { isValid: false, error: '이메일을 입력해주세요' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: '올바른 이메일 형식을 입력해주세요' };
  }

  return { isValid: true };
}

// Password validation
export function validatePassword(password: string, options?: {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
}): ValidationResult {
  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecial = false,
  } = options || {};

  if (!password) {
    return { isValid: false, error: '비밀번호를 입력해주세요' };
  }

  if (password.length < minLength) {
    return { isValid: false, error: `비밀번호는 ${minLength}자 이상이어야 합니다` };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: '비밀번호에 대문자를 포함해주세요' };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: '비밀번호에 소문자를 포함해주세요' };
  }

  if (requireNumber && !/\d/.test(password)) {
    return { isValid: false, error: '비밀번호에 숫자를 포함해주세요' };
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: '비밀번호에 특수문자를 포함해주세요' };
  }

  return { isValid: true };
}

// Password confirmation validation
export function validatePasswordConfirm(password: string, confirm: string): ValidationResult {
  if (!confirm) {
    return { isValid: false, error: '비밀번호 확인을 입력해주세요' };
  }

  if (password !== confirm) {
    return { isValid: false, error: '비밀번호가 일치하지 않습니다' };
  }

  return { isValid: true };
}

// Name validation
export function validateName(name: string, options?: {
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}): ValidationResult {
  const { minLength = 2, maxLength = 50, required = true } = options || {};

  if (!name.trim()) {
    if (required) {
      return { isValid: false, error: '이름을 입력해주세요' };
    }
    return { isValid: true };
  }

  if (name.trim().length < minLength) {
    return { isValid: false, error: `이름은 ${minLength}자 이상이어야 합니다` };
  }

  if (name.trim().length > maxLength) {
    return { isValid: false, error: `이름은 ${maxLength}자 이하여야 합니다` };
  }

  return { isValid: true };
}

// Required field validation
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value.trim()) {
    return { isValid: false, error: `${fieldName}을(를) 입력해주세요` };
  }
  return { isValid: true };
}

// URL validation
export function validateUrl(url: string, options?: { required?: boolean }): ValidationResult {
  const { required = false } = options || {};

  if (!url.trim()) {
    if (required) {
      return { isValid: false, error: 'URL을 입력해주세요' };
    }
    return { isValid: true };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: '올바른 URL 형식을 입력해주세요' };
  }
}

// Phone number validation (Korean format)
export function validatePhone(phone: string, options?: { required?: boolean }): ValidationResult {
  const { required = false } = options || {};

  if (!phone.trim()) {
    if (required) {
      return { isValid: false, error: '전화번호를 입력해주세요' };
    }
    return { isValid: true };
  }

  // Remove hyphens and spaces for validation
  const cleaned = phone.replace(/[-\s]/g, '');
  const phoneRegex = /^(01[0-9]|02|0[3-9][0-9])\d{7,8}$/;

  if (!phoneRegex.test(cleaned)) {
    return { isValid: false, error: '올바른 전화번호 형식을 입력해주세요' };
  }

  return { isValid: true };
}

// Number range validation
export function validateNumberRange(
  value: number,
  options: { min?: number; max?: number; fieldName?: string }
): ValidationResult {
  const { min, max, fieldName = '값' } = options;

  if (min !== undefined && value < min) {
    return { isValid: false, error: `${fieldName}은(는) ${min} 이상이어야 합니다` };
  }

  if (max !== undefined && value > max) {
    return { isValid: false, error: `${fieldName}은(는) ${max} 이하여야 합니다` };
  }

  return { isValid: true };
}

// Form validation helper
export function validateForm(validations: { [key: string]: ValidationResult }): {
  isValid: boolean;
  errors: { [key: string]: string };
  firstError?: string;
} {
  const errors: { [key: string]: string } = {};
  let isValid = true;
  let firstError: string | undefined;

  for (const [field, result] of Object.entries(validations)) {
    if (!result.isValid && result.error) {
      errors[field] = result.error;
      isValid = false;
      if (!firstError) {
        firstError = result.error;
      }
    }
  }

  return { isValid, errors, firstError };
}

// Password strength meter
export function getPasswordStrength(password: string): {
  score: number; // 0-4
  label: string;
  color: string;
} {
  if (!password) {
    return { score: 0, label: '', color: 'gray' };
  }

  let score = 0;

  // Length score
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety score
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  // Cap at 4
  score = Math.min(score, 4);

  const labels = ['매우 약함', '약함', '보통', '강함', '매우 강함'];
  const colors = ['red', 'orange', 'yellow', 'green', 'emerald'];

  return {
    score,
    label: labels[score],
    color: colors[score],
  };
}
