/**
 * Form Validation Utility Tests
 * 폼 유효성 검사 유틸리티 테스트
 */

import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateName,
  validateRequired,
  validateUrl,
  validatePhone,
  validateNumberRange,
  validateForm,
  getPasswordStrength,
} from '../validation';

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('user@example.com').isValid).toBe(true);
    expect(validateEmail('test.user@domain.co.kr').isValid).toBe(true);
    expect(validateEmail('user+tag@example.com').isValid).toBe(true);
  });

  it('should reject empty email', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('이메일');
  });

  it('should reject invalid email format', () => {
    expect(validateEmail('notanemail').isValid).toBe(false);
    expect(validateEmail('@example.com').isValid).toBe(false);
    expect(validateEmail('user@').isValid).toBe(false);
    expect(validateEmail('user @example.com').isValid).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should validate passwords meeting minimum length', () => {
    expect(validatePassword('12345678').isValid).toBe(true);
    expect(validatePassword('mySecurePassword').isValid).toBe(true);
  });

  it('should reject empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('비밀번호');
  });

  it('should reject passwords below minimum length', () => {
    const result = validatePassword('short', { minLength: 8 });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('8자');
  });

  it('should enforce uppercase requirement', () => {
    const result = validatePassword('lowercase123', { requireUppercase: true });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('대문자');
  });

  it('should enforce lowercase requirement', () => {
    const result = validatePassword('UPPERCASE123', { requireLowercase: true });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('소문자');
  });

  it('should enforce number requirement', () => {
    const result = validatePassword('NoNumbers', { requireNumber: true });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('숫자');
  });

  it('should enforce special character requirement', () => {
    const result = validatePassword('NoSpecial123', { requireSpecial: true });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('특수문자');
  });
});

describe('validatePasswordConfirm', () => {
  it('should validate matching passwords', () => {
    const result = validatePasswordConfirm('password123', 'password123');
    expect(result.isValid).toBe(true);
  });

  it('should reject empty confirmation', () => {
    const result = validatePasswordConfirm('password123', '');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('확인');
  });

  it('should reject non-matching passwords', () => {
    const result = validatePasswordConfirm('password123', 'password456');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('일치하지');
  });
});

describe('validateName', () => {
  it('should validate correct names', () => {
    expect(validateName('홍길동').isValid).toBe(true);
    expect(validateName('John Doe').isValid).toBe(true);
  });

  it('should reject empty name when required', () => {
    const result = validateName('', { required: true });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('이름');
  });

  it('should accept empty name when not required', () => {
    const result = validateName('', { required: false });
    expect(result.isValid).toBe(true);
  });

  it('should reject names below minimum length', () => {
    const result = validateName('A', { minLength: 2 });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('2자');
  });

  it('should reject names above maximum length', () => {
    const result = validateName('A'.repeat(51), { maxLength: 50 });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('50자');
  });
});

describe('validateRequired', () => {
  it('should validate non-empty values', () => {
    expect(validateRequired('some value', '필드').isValid).toBe(true);
  });

  it('should reject empty values', () => {
    const result = validateRequired('', '제목');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('제목');
  });

  it('should reject whitespace-only values', () => {
    const result = validateRequired('   ', '내용');
    expect(result.isValid).toBe(false);
  });
});

describe('validateUrl', () => {
  it('should validate correct URLs', () => {
    expect(validateUrl('https://example.com').isValid).toBe(true);
    expect(validateUrl('http://localhost:3000').isValid).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(validateUrl('not-a-url').isValid).toBe(false);
    expect(validateUrl('ftp://example.com').isValid).toBe(false);
  });

  it('should accept empty URL when not required', () => {
    expect(validateUrl('', { required: false }).isValid).toBe(true);
  });

  it('should reject empty URL when required', () => {
    const result = validateUrl('', { required: true });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('URL');
  });
});

describe('validatePhone', () => {
  it('should validate Korean phone numbers', () => {
    expect(validatePhone('01012345678').isValid).toBe(true);
    expect(validatePhone('010-1234-5678').isValid).toBe(true);
    expect(validatePhone('02-123-4567').isValid).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(validatePhone('12345').isValid).toBe(false);
    expect(validatePhone('abcdefghijk').isValid).toBe(false);
  });

  it('should accept empty phone when not required', () => {
    expect(validatePhone('', { required: false }).isValid).toBe(true);
  });
});

describe('validateNumberRange', () => {
  it('should validate numbers within range', () => {
    expect(validateNumberRange(5, { min: 0, max: 10 }).isValid).toBe(true);
    expect(validateNumberRange(0, { min: 0 }).isValid).toBe(true);
    expect(validateNumberRange(100, { max: 100 }).isValid).toBe(true);
  });

  it('should reject numbers below minimum', () => {
    const result = validateNumberRange(-1, { min: 0, fieldName: '점수' });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('0 이상');
  });

  it('should reject numbers above maximum', () => {
    const result = validateNumberRange(101, { max: 100, fieldName: '점수' });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('100 이하');
  });
});

describe('validateForm', () => {
  it('should return valid when all fields pass', () => {
    const result = validateForm({
      email: { isValid: true },
      password: { isValid: true },
    });
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('should collect all errors', () => {
    const result = validateForm({
      email: { isValid: false, error: '이메일 오류' },
      password: { isValid: false, error: '비밀번호 오류' },
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe('이메일 오류');
    expect(result.errors.password).toBe('비밀번호 오류');
  });

  it('should return first error', () => {
    const result = validateForm({
      email: { isValid: false, error: '이메일 오류' },
      password: { isValid: false, error: '비밀번호 오류' },
    });
    expect(result.firstError).toBe('이메일 오류');
  });
});

describe('getPasswordStrength', () => {
  it('should return 0 for empty password', () => {
    const result = getPasswordStrength('');
    expect(result.score).toBe(0);
  });

  it('should return low score for weak password', () => {
    const result = getPasswordStrength('abc');
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('should return higher score for longer password', () => {
    const short = getPasswordStrength('abcdefgh');
    const long = getPasswordStrength('abcdefghijklm');
    expect(long.score).toBeGreaterThanOrEqual(short.score);
  });

  it('should return higher score for mixed case', () => {
    const lower = getPasswordStrength('abcdefghij');
    const mixed = getPasswordStrength('AbCdEfGhIj');
    expect(mixed.score).toBeGreaterThan(lower.score);
  });

  it('should return higher score for numbers', () => {
    const noNum = getPasswordStrength('abcdefgh');
    const withNum = getPasswordStrength('abcdef12');
    expect(withNum.score).toBeGreaterThanOrEqual(noNum.score);
  });

  it('should return higher score for special characters', () => {
    const noSpecial = getPasswordStrength('Abcdefg1');
    const withSpecial = getPasswordStrength('Abcdefg1!');
    expect(withSpecial.score).toBeGreaterThanOrEqual(noSpecial.score);
  });

  it('should cap score at 4', () => {
    const result = getPasswordStrength('VeryStr0ng!Pass@Word#123');
    expect(result.score).toBeLessThanOrEqual(4);
  });

  it('should return appropriate labels', () => {
    const weak = getPasswordStrength('abc');
    const strong = getPasswordStrength('Str0ng!Pass');
    expect(weak.label).toContain('약');
    expect(['강함', '매우 강함']).toContain(strong.label);
  });
});
