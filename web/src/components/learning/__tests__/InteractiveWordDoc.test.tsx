/**
 * Interactive Word Documentation Component Tests
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InteractiveWordDoc from '../InteractiveWordDoc';

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock interactive doc data
const mockInteractiveDoc = {
  wordId: 'test-word-id',
  word: 'serendipity',
  steps: [
    {
      id: 'step-introduction',
      number: 1,
      title: 'Introduction',
      description: 'Learn the basics',
      estimatedTime: 2,
      blocks: [
        {
          type: 'text' as const,
          content: 'Welcome to learning serendipity!',
        },
        {
          type: 'pronunciation' as const,
          phonetic: '/ˌserənˈdipitē/',
          audio: '/audio/serendipity.mp3',
        },
      ],
    },
    {
      id: 'step-visualization',
      number: 2,
      title: 'Visualization',
      description: 'Visual learning',
      estimatedTime: 3,
      blocks: [
        {
          type: 'image' as const,
          url: 'https://example.com/image.jpg',
          caption: 'Example image',
        },
      ],
    },
  ],
  metadata: {
    totalSteps: 2,
    totalEstimatedTime: 5,
    difficulty: 'INTERMEDIATE' as const,
  },
};

describe('InteractiveWordDoc Component', () => {
  describe('Rendering', () => {
    it('should render the component', () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);
      expect(screen.getByText('serendipity')).toBeInTheDocument();
    });

    it('should display step navigation', () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);
      expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
    });

    it('should show first step by default', () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Learn the basics')).toBeInTheDocument();
    });

    it('should display estimated time', () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);
      expect(screen.getByText(/2 min/)).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should navigate to next step', async () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Visualization')).toBeInTheDocument();
        expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
      });
    });

    it('should navigate to previous step', async () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);

      // Go to step 2
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Visualization')).toBeInTheDocument();
      });

      // Go back to step 1
      const prevButton = screen.getByText('Previous');
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('Introduction')).toBeInTheDocument();
        expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
      });
    });

    it('should disable previous button on first step', () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);

      const prevButton = screen.getByText('Previous');
      expect(prevButton).toBeDisabled();
    });

    it('should show complete button on last step', async () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);

      // Navigate to last step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Complete')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should mark step as completed when moving to next', async () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        // Check if step 1 is marked as completed (visual indicator)
        const stepIndicators = screen.getAllByRole('button', { name: /Step \d/ });
        expect(stepIndicators[0]).toHaveClass('completed');
      });
    });

    it('should track time spent on step', async () => {
      jest.useFakeTimers();

      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);

      // Simulate time passing
      jest.advanceTimersByTime(5000); // 5 seconds

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        // Time tracking should have recorded ~5 seconds
        expect(screen.getByText(/\d+ seconds?/)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Content Blocks', () => {
    it('should render text blocks', () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);
      expect(screen.getByText('Welcome to learning serendipity!')).toBeInTheDocument();
    });

    it('should render pronunciation block', () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);
      expect(screen.getByText('/ˌserənˈdipitē/')).toBeInTheDocument();
    });

    it('should render image blocks', async () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);

      // Navigate to visualization step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        const image = screen.getByAltText('Example image');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      });
    });
  });

  describe('Completion', () => {
    it('should show completion screen when finished', async () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);

      // Navigate to last step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        const completeButton = screen.getByText('Complete');
        fireEvent.click(completeButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Congratulations/i)).toBeInTheDocument();
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
      });
    });

    it('should call onComplete callback', async () => {
      const onComplete = jest.fn();
      render(
        <InteractiveWordDoc
          interactiveDoc={mockInteractiveDoc}
          onComplete={onComplete}
        />
      );

      // Navigate to last step and complete
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        const completeButton = screen.getByText('Complete');
        fireEvent.click(completeButton);
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith({
          wordId: 'test-word-id',
          stepsCompleted: 2,
          totalTimeSpent: expect.any(Number),
        });
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate with arrow keys', async () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);

      // Press right arrow
      fireEvent.keyDown(document, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Visualization')).toBeInTheDocument();
      });

      // Press left arrow
      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      await waitFor(() => {
        expect(screen.getByText('Introduction')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);

      expect(screen.getByRole('region', { name: /interactive learning/i })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /step navigation/i })).toBeInTheDocument();
    });

    it('should announce step changes to screen readers', async () => {
      render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} />);

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/Step 2/);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing steps gracefully', () => {
      const invalidDoc = {
        ...mockInteractiveDoc,
        steps: [],
      };

      render(<InteractiveWordDoc interactiveDoc={invalidDoc} />);
      expect(screen.getByText(/No steps available/i)).toBeInTheDocument();
    });

    it('should handle invalid block types', () => {
      const docWithInvalidBlock = {
        ...mockInteractiveDoc,
        steps: [
          {
            ...mockInteractiveDoc.steps[0],
            blocks: [
              {
                type: 'invalid-type' as any,
                content: 'Test',
              },
            ],
          },
        ],
      };

      render(<InteractiveWordDoc interactiveDoc={docWithInvalidBlock} />);
      // Should not crash, should render without the invalid block
      expect(screen.getByText('Introduction')).toBeInTheDocument();
    });
  });
});

describe('InteractiveWordDoc Integration', () => {
  it('should integrate with progress tracking API', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    render(<InteractiveWordDoc interactiveDoc={mockInteractiveDoc} userId="test-user" />);

    // Complete a step
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/words/'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('step-introduction'),
        })
      );
    });
  });
});
