// Phase 6-2: Unit Tests for Input Validation
// Testing security validation functions

import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateURL,
  sanitizeHTML,
  sanitizeText,
  escapeSQLString,
  escapeShellArg,
  sanitizePath,
  validateFileUpload,
} from '../validation';

describe('Email Validation', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('user@example.com').valid).toBe(true);
    expect(validateEmail('test.user@domain.co.uk').valid).toBe(true);
    expect(validateEmail('user+tag@example.com').valid).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('').valid).toBe(false);
    expect(validateEmail('notanemail').valid).toBe(false);
    expect(validateEmail('@example.com').valid).toBe(false);
    expect(validateEmail('user@').valid).toBe(false);
    expect(validateEmail('user @example.com').valid).toBe(false);
  });

  it('should reject emails that are too long', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(validateEmail(longEmail).valid).toBe(false);
  });
});

describe('Password Validation', () => {
  it('should validate strong passwords', () => {
    expect(validatePassword('Test1234').valid).toBe(true);
    expect(validatePassword('MyP@ssw0rd!').valid).toBe(true);
    expect(validatePassword('Secur3Pass').valid).toBe(true);
  });

  it('should reject weak passwords', () => {
    expect(validatePassword('').valid).toBe(false);
    expect(validatePassword('short').valid).toBe(false);
    expect(validatePassword('alllowercase1').valid).toBe(false);
    expect(validatePassword('ALLUPPERCASE1').valid).toBe(false);
    expect(validatePassword('NoNumbers').valid).toBe(false);
  });

  it('should reject common weak passwords', () => {
    expect(validatePassword('password').valid).toBe(false);
    expect(validatePassword('password123').valid).toBe(false);
    expect(validatePassword('12345678').valid).toBe(false);
  });

  it('should reject passwords that are too long', () => {
    const longPassword = 'A1' + 'a'.repeat(130);
    expect(validatePassword(longPassword).valid).toBe(false);
  });
});

describe('Username Validation', () => {
  it('should validate correct usernames', () => {
    expect(validateUsername('user123').valid).toBe(true);
    expect(validateUsername('test_user').valid).toBe(true);
    expect(validateUsername('User_Name_123').valid).toBe(true);
  });

  it('should reject invalid usernames', () => {
    expect(validateUsername('').valid).toBe(false);
    expect(validateUsername('ab').valid).toBe(false); // too short
    expect(validateUsername('a'.repeat(21)).valid).toBe(false); // too long
    expect(validateUsername('user name').valid).toBe(false); // space
    expect(validateUsername('user-name').valid).toBe(false); // hyphen
    expect(validateUsername('user@name').valid).toBe(false); // special char
  });
});

describe('URL Validation', () => {
  it('should validate correct URLs', () => {
    expect(validateURL('https://example.com').valid).toBe(true);
    expect(validateURL('http://test.com/path').valid).toBe(true);
    expect(validateURL('https://sub.domain.com:8080/path?query=1').valid).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(validateURL('').valid).toBe(false);
    expect(validateURL('not-a-url').valid).toBe(false);
    expect(validateURL('ftp://example.com').valid).toBe(false); // wrong protocol
    expect(validateURL('javascript:alert(1)').valid).toBe(false);
  });
});

describe('HTML Sanitization', () => {
  it('should remove script tags', () => {
    const dirty = '<p>Hello</p><script>alert("xss")</script>';
    const clean = sanitizeHTML(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert');
  });

  it('should remove iframe tags', () => {
    const dirty = '<p>Content</p><iframe src="evil.com"></iframe>';
    const clean = sanitizeHTML(dirty);
    expect(clean).not.toContain('<iframe>');
    expect(clean).not.toContain('evil.com');
  });

  it('should remove event handlers', () => {
    const dirty = '<div onclick="alert(1)">Click me</div>';
    const clean = sanitizeHTML(dirty);
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('alert');
  });

  it('should remove javascript: URIs', () => {
    const dirty = '<a href="javascript:alert(1)">Click</a>';
    const clean = sanitizeHTML(dirty);
    expect(clean).not.toContain('javascript:');
  });

  it('should keep safe HTML', () => {
    const safe = '<p>Hello <strong>world</strong>!</p>';
    const clean = sanitizeHTML(safe);
    expect(clean).toContain('<p>');
    expect(clean).toContain('<strong>');
  });
});

describe('Text Sanitization', () => {
  it('should strip all HTML tags', () => {
    const dirty = '<p>Hello <strong>world</strong>!</p>';
    const clean = sanitizeText(dirty);
    expect(clean).toBe('Hello world!');
  });

  it('should handle script tags', () => {
    const dirty = 'Text<script>alert(1)</script>More';
    const clean = sanitizeText(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert');
  });
});

describe('SQL Injection Prevention', () => {
  it('should escape dangerous SQL characters', () => {
    expect(escapeSQLString("'; DROP TABLE users--")).toContain('\\');
    expect(escapeSQLString('"SELECT * FROM users"')).toContain('\\');
    expect(escapeSQLString("test\\test")).toContain('\\\\');
  });

  it('should escape null bytes', () => {
    const result = escapeSQLString('test\x00test');
    expect(result).toContain('\\0');
  });

  it('should escape newlines', () => {
    const result = escapeSQLString('test\ntest');
    expect(result).toContain('\\n');
  });
});

describe('Command Injection Prevention', () => {
  it('should escape shell metacharacters', () => {
    expect(escapeShellArg('test;ls')).toContain('\\;');
    expect(escapeShellArg('test&whoami')).toContain('\\&');
    expect(escapeShellArg('test|cat')).toContain('\\|');
    expect(escapeShellArg('test`id`')).toContain('\\`');
    expect(escapeShellArg('test$(date)')).toContain('\\$');
  });

  it('should handle parentheses', () => {
    expect(escapeShellArg('test(test)')).toContain('\\(');
    expect(escapeShellArg('test(test)')).toContain('\\)');
  });
});

describe('Path Traversal Prevention', () => {
  it('should remove ../ sequences', () => {
    expect(sanitizePath('../etc/passwd')).not.toContain('..');
    expect(sanitizePath('dir/../../file')).not.toContain('..');
  });

  it('should handle backslashes', () => {
    expect(sanitizePath('..\\windows\\system32')).not.toContain('..');
  });

  it('should keep safe paths', () => {
    expect(sanitizePath('dir/file.txt')).toBe('dir/file.txt');
    expect(sanitizePath('./file.txt')).toBe('./file.txt');
  });
});

describe('File Upload Validation', () => {
  const createMockFile = (name: string, size: number, type: string): File => {
    return new File([''], name, { type });
  };

  it('should validate files within size limit', () => {
    const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
    const result = validateFileUpload(file, {
      maxSize: 5 * 1024 * 1024,
    });
    expect(result.valid).toBe(true);
  });

  it('should reject files exceeding size limit', () => {
    const file = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg');
    const result = validateFileUpload(file, {
      maxSize: 5 * 1024 * 1024,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('size exceeds');
  });

  it('should validate allowed MIME types', () => {
    const file = createMockFile('test.jpg', 1024, 'image/jpeg');
    const result = validateFileUpload(file, {
      allowedTypes: ['image/jpeg', 'image/png'],
    });
    expect(result.valid).toBe(true);
  });

  it('should reject disallowed MIME types', () => {
    const file = createMockFile('test.exe', 1024, 'application/x-msdownload');
    const result = validateFileUpload(file, {
      allowedTypes: ['image/jpeg', 'image/png'],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('should validate allowed extensions', () => {
    const file = createMockFile('test.jpg', 1024, 'image/jpeg');
    const result = validateFileUpload(file, {
      allowedExtensions: ['jpg', 'jpeg', 'png'],
    });
    expect(result.valid).toBe(true);
  });

  it('should reject disallowed extensions', () => {
    const file = createMockFile('test.exe', 1024, 'application/x-msdownload');
    const result = validateFileUpload(file, {
      allowedExtensions: ['jpg', 'png'],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('extension');
  });
});
