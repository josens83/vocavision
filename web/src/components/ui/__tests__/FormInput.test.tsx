/**
 * Form Input Component Tests
 * 폼 입력 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormInput, FormError, FormSuccess, SubmitButton } from '../FormInput';

describe('FormInput', () => {
  it('renders label and input', () => {
    render(<FormInput label="이메일" type="email" />);
    expect(screen.getByText('이메일')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(<FormInput label="이메일" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<FormInput label="이메일" error="이메일을 입력해주세요" />);
    expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument();
  });

  it('displays hint text when no error', () => {
    render(<FormInput label="비밀번호" hint="8자 이상 입력하세요" />);
    expect(screen.getByText('8자 이상 입력하세요')).toBeInTheDocument();
  });

  it('hides hint when error is shown', () => {
    render(
      <FormInput
        label="비밀번호"
        hint="8자 이상 입력하세요"
        error="비밀번호 오류"
      />
    );
    expect(screen.queryByText('8자 이상 입력하세요')).not.toBeInTheDocument();
    expect(screen.getByText('비밀번호 오류')).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<FormInput label="비밀번호" type="password" />);

    const input = screen.getByLabelText('비밀번호 *', { exact: false });
    const toggleButton = screen.getByRole('button');

    // Initially password is hidden
    expect(input).toHaveAttribute('type', 'password');

    // Click to show password
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');

    // Click to hide password
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('shows password strength meter when enabled', () => {
    render(
      <FormInput
        label="비밀번호"
        type="password"
        value="Test1234!"
        showPasswordStrength
        onChange={() => {}}
      />
    );

    // Check for strength indicator bars
    const strengthBars = document.querySelectorAll('.rounded-full.h-1');
    expect(strengthBars.length).toBe(4);
  });

  it('handles onChange event', () => {
    const onChange = jest.fn();
    render(<FormInput label="이메일" onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'test@example.com' },
    });

    expect(onChange).toHaveBeenCalled();
  });

  it('handles onBlur event', () => {
    const onBlur = jest.fn();
    render(<FormInput label="이메일" onBlur={onBlur} />);

    fireEvent.blur(screen.getByRole('textbox'));
    expect(onBlur).toHaveBeenCalled();
  });

  it('handles onFocus event', () => {
    const onFocus = jest.fn();
    render(<FormInput label="이메일" onFocus={onFocus} />);

    fireEvent.focus(screen.getByRole('textbox'));
    expect(onFocus).toHaveBeenCalled();
  });

  it('applies error styles when error is present', () => {
    render(<FormInput label="이메일" error="오류" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-red');
  });
});

describe('FormError', () => {
  it('renders error message', () => {
    render(<FormError message="오류가 발생했습니다" />);
    expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument();
  });

  it('has error styling', () => {
    render(<FormError message="오류" />);
    const container = screen.getByText('오류').closest('div');
    expect(container?.className).toContain('bg-red');
  });
});

describe('FormSuccess', () => {
  it('renders success message', () => {
    render(<FormSuccess message="성공적으로 저장되었습니다" />);
    expect(screen.getByText('성공적으로 저장되었습니다')).toBeInTheDocument();
  });

  it('has success styling', () => {
    render(<FormSuccess message="성공" />);
    const container = screen.getByText('성공').closest('div');
    expect(container?.className).toContain('bg-green');
  });
});

describe('SubmitButton', () => {
  it('renders children', () => {
    render(<SubmitButton>제출하기</SubmitButton>);
    expect(screen.getByText('제출하기')).toBeInTheDocument();
  });

  it('shows loading text when loading', () => {
    render(
      <SubmitButton loading loadingText="처리 중...">
        제출하기
      </SubmitButton>
    );
    expect(screen.getByText('처리 중...')).toBeInTheDocument();
    expect(screen.queryByText('제출하기')).not.toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<SubmitButton loading>제출하기</SubmitButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<SubmitButton disabled>제출하기</SubmitButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when loading', () => {
    render(<SubmitButton loading>제출하기</SubmitButton>);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('has type submit', () => {
    render(<SubmitButton>제출하기</SubmitButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('applies custom className', () => {
    render(<SubmitButton className="custom-class">제출하기</SubmitButton>);
    expect(screen.getByRole('button').className).toContain('custom-class');
  });
});
