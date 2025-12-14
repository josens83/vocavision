/**
 * Empty State Component Tests
 * 빈 상태 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  EmptyState,
  EmptySearchResults,
  EmptyFirstTime,
  EmptyAllCaughtUp,
  EmptyError,
  EmptyOffline,
  EmptyComingSoon,
  EmptyNotifications,
  CelebrateCompletion,
} from '../EmptyState';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="테스트 제목"
        description="테스트 설명입니다."
      />
    );

    expect(screen.getByText('테스트 제목')).toBeInTheDocument();
    expect(screen.getByText('테스트 설명입니다.')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(<EmptyState title="테스트" icon="🎉" />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('renders action button with href', () => {
    render(
      <EmptyState
        title="테스트"
        action={{ label: '시작하기', href: '/start' }}
      />
    );

    const link = screen.getByText('시작하기');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/start');
  });

  it('renders action button with onClick', () => {
    const onClick = jest.fn();
    render(
      <EmptyState
        title="테스트"
        action={{ label: '클릭', onClick }}
      />
    );

    fireEvent.click(screen.getByText('클릭'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders secondary action', () => {
    render(
      <EmptyState
        title="테스트"
        action={{ label: '주요 액션', href: '/main' }}
        secondaryAction={{ label: '보조 액션', href: '/secondary' }}
      />
    );

    expect(screen.getByText('주요 액션')).toBeInTheDocument();
    expect(screen.getByText('보조 액션')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <EmptyState title="테스트">
        <div data-testid="child">자식 요소</div>
      </EmptyState>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

describe('EmptySearchResults', () => {
  it('renders without query', () => {
    render(<EmptySearchResults />);
    expect(screen.getByText('검색 결과 없음')).toBeInTheDocument();
    expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('renders with query', () => {
    render(<EmptySearchResults query="테스트 검색어" />);
    expect(screen.getByText(/"테스트 검색어"/)).toBeInTheDocument();
  });

  it('renders clear button when onClear provided', () => {
    const onClear = jest.fn();
    render(<EmptySearchResults onClear={onClear} />);

    const clearButton = screen.getByText('검색 초기화');
    fireEvent.click(clearButton);
    expect(onClear).toHaveBeenCalled();
  });
});

describe('EmptyFirstTime', () => {
  it('renders words type', () => {
    render(<EmptyFirstTime type="words" />);
    expect(screen.getByText(/학습한 단어/)).toBeInTheDocument();
    expect(screen.getByText('시작하기')).toBeInTheDocument();
  });

  it('renders decks type', () => {
    render(<EmptyFirstTime type="decks" />);
    expect(screen.getByText(/생성한 덱/)).toBeInTheDocument();
  });

  it('renders bookmarks type', () => {
    render(<EmptyFirstTime type="bookmarks" />);
    expect(screen.getByText(/북마크한 단어/)).toBeInTheDocument();
  });

  it('renders history type', () => {
    render(<EmptyFirstTime type="history" />);
    expect(screen.getByText(/학습 기록/)).toBeInTheDocument();
  });

  it('renders reviews type', () => {
    render(<EmptyFirstTime type="reviews" />);
    expect(screen.getByText(/복습할 단어/)).toBeInTheDocument();
  });

  it('renders custom action label', () => {
    render(<EmptyFirstTime type="words" actionLabel="바로 시작" />);
    expect(screen.getByText('바로 시작')).toBeInTheDocument();
  });

  it('renders custom action href', () => {
    render(<EmptyFirstTime type="words" actionHref="/custom" />);
    const link = screen.getByText('시작하기');
    expect(link.closest('a')).toHaveAttribute('href', '/custom');
  });
});

describe('EmptyAllCaughtUp', () => {
  it('renders completion message', () => {
    render(<EmptyAllCaughtUp />);
    expect(screen.getByText('모든 복습 완료!')).toBeInTheDocument();
    expect(screen.getByText('새 단어 학습하기')).toBeInTheDocument();
    expect(screen.getByText('대시보드로')).toBeInTheDocument();
  });
});

describe('EmptyError', () => {
  it('renders error message', () => {
    render(<EmptyError />);
    expect(screen.getByText(/불러올 수 없/)).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = jest.fn();
    render(<EmptyError onRetry={onRetry} />);

    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('EmptyOffline', () => {
  it('renders offline message', () => {
    render(<EmptyOffline />);
    expect(screen.getByText('오프라인 상태입니다')).toBeInTheDocument();
    expect(screen.getByText(/인터넷 연결/)).toBeInTheDocument();
  });
});

describe('EmptyComingSoon', () => {
  it('renders coming soon message', () => {
    render(<EmptyComingSoon />);
    expect(screen.getByText('준비 중이에요')).toBeInTheDocument();
  });

  it('renders with feature name', () => {
    render(<EmptyComingSoon feature="AI 튜터" />);
    expect(screen.getByText(/AI 튜터/)).toBeInTheDocument();
  });
});

describe('EmptyNotifications', () => {
  it('renders no notifications message', () => {
    render(<EmptyNotifications />);
    expect(screen.getByText('알림이 없어요')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<EmptyNotifications message="읽지 않은 알림이 없습니다" />);
    expect(screen.getByText('읽지 않은 알림이 없습니다')).toBeInTheDocument();
  });
});

describe('CelebrateCompletion', () => {
  it('renders score and total', () => {
    render(<CelebrateCompletion score={8} total={10} />);
    expect(screen.getByText(/10문제 중 8문제/)).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('renders perfect score celebration', () => {
    render(<CelebrateCompletion score={10} total={10} />);
    expect(screen.getByText('완벽해요!')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('renders good score celebration', () => {
    render(<CelebrateCompletion score={8} total={10} />);
    expect(screen.getByText('잘했어요!')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('renders encouraging message for lower scores', () => {
    render(<CelebrateCompletion score={5} total={10} />);
    expect(screen.getByText('수고했어요!')).toBeInTheDocument();
    expect(screen.getByText('💪')).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = jest.fn();
    render(<CelebrateCompletion score={5} total={10} onRetry={onRetry} />);

    fireEvent.click(screen.getByText('다시 도전'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders home button when onHome provided', () => {
    const onHome = jest.fn();
    render(<CelebrateCompletion score={5} total={10} onHome={onHome} />);

    fireEvent.click(screen.getByText('홈으로'));
    expect(onHome).toHaveBeenCalled();
  });
});
