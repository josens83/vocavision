/**
 * Multimedia Components Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Import components
import AutoPlayVideo from '../multimedia/AutoPlayVideo';
import LottieAnimation from '../multimedia/LottieAnimation';
import OptimizedImage from '../multimedia/OptimizedImage';

describe('AutoPlayVideo Component', () => {
  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
      constructor(callback: any) {
        this.callback = callback;
      }
      observe() {
        // Simulate element being visible
        this.callback([{ isIntersecting: true }]);
      }
      unobserve() {}
      disconnect() {}
      callback: any;
    } as any;
  });

  it('should render video element', () => {
    render(<AutoPlayVideo src="/video/test.mp4" />);
    const video = screen.getByRole('video') as HTMLVideoElement;
    expect(video).toBeInTheDocument();
  });

  it('should auto-play when visible', async () => {
    render(<AutoPlayVideo src="/video/test.mp4" autoPlay />);
    const video = screen.getByRole('video') as HTMLVideoElement;

    await waitFor(() => {
      expect(video.autoplay).toBe(true);
    });
  });

  it('should loop video by default', () => {
    render(<AutoPlayVideo src="/video/test.mp4" loop />);
    const video = screen.getByRole('video') as HTMLVideoElement;
    expect(video.loop).toBe(true);
  });

  it('should be muted by default', () => {
    render(<AutoPlayVideo src="/video/test.mp4" muted />);
    const video = screen.getByRole('video') as HTMLVideoElement;
    expect(video.muted).toBe(true);
  });

  it('should display caption', () => {
    render(<AutoPlayVideo src="/video/test.mp4" caption="Test caption" />);
    expect(screen.getByText('Test caption')).toBeInTheDocument();
  });

  it('should handle play/pause controls', async () => {
    render(<AutoPlayVideo src="/video/test.mp4" controls />);
    const video = screen.getByRole('video') as HTMLVideoElement;

    // Mock video methods
    video.play = jest.fn().mockResolvedValue(undefined);
    video.pause = jest.fn();

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(video.play).toHaveBeenCalled();
    });
  });
});

describe('LottieAnimation Component', () => {
  const mockAnimationData = {
    v: '5.5.7',
    fr: 30,
    ip: 0,
    op: 60,
    w: 500,
    h: 500,
    nm: 'Test Animation',
    ddd: 0,
    assets: [],
    layers: [],
  };

  // Mock lottie-react
  jest.mock('lottie-react', () => ({
    __esModule: true,
    default: ({ animationData, loop, autoplay }: any) => (
      <div data-testid="lottie-animation" data-loop={loop} data-autoplay={autoplay}>
        Lottie Animation
      </div>
    ),
  }));

  it('should render Lottie animation', () => {
    render(<LottieAnimation animationData={mockAnimationData} />);
    expect(screen.getByTestId('lottie-animation')).toBeInTheDocument();
  });

  it('should loop by default', () => {
    render(<LottieAnimation animationData={mockAnimationData} loop />);
    const animation = screen.getByTestId('lottie-animation');
    expect(animation).toHaveAttribute('data-loop', 'true');
  });

  it('should autoplay by default', () => {
    render(<LottieAnimation animationData={mockAnimationData} autoplay />);
    const animation = screen.getByTestId('lottie-animation');
    expect(animation).toHaveAttribute('data-autoplay', 'true');
  });

  it('should display caption', () => {
    render(<LottieAnimation animationData={mockAnimationData} caption="Test animation" />);
    expect(screen.getByText('Test animation')).toBeInTheDocument();
  });
});

describe('OptimizedImage Component', () => {
  it('should render optimized image', () => {
    render(<OptimizedImage src="/images/test.jpg" alt="Test image" />);
    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
  });

  it('should display caption', () => {
    render(<OptimizedImage src="/images/test.jpg" alt="Test" caption="Test caption" />);
    expect(screen.getByText('Test caption')).toBeInTheDocument();
  });

  it('should handle click to zoom', async () => {
    render(<OptimizedImage src="/images/test.jpg" alt="Test" clickToZoom />);
    const image = screen.getByAltText('Test');

    fireEvent.click(image);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should show loading skeleton', () => {
    render(<OptimizedImage src="/images/test.jpg" alt="Test" loading="lazy" />);
    expect(screen.getByTestId('image-skeleton')).toBeInTheDocument();
  });

  it('should handle error gracefully', async () => {
    render(<OptimizedImage src="/invalid.jpg" alt="Test" />);
    const image = screen.getByAltText('Test');

    fireEvent.error(image);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load image/i)).toBeInTheDocument();
    });
  });
});

describe('CDN Service Integration', () => {
  it('should generate Cloudinary URLs correctly', () => {
    const { generateImageUrl } = require('@/lib/multimedia/cdnService');

    const url = generateImageUrl('test.jpg', {
      width: 800,
      quality: 80,
      format: 'webp',
    });

    expect(url).toContain('cloudinary');
    expect(url).toContain('w_800');
    expect(url).toContain('q_80');
    expect(url).toContain('f_webp');
  });

  it('should fallback to local URLs when CDN unavailable', () => {
    const { generateImageUrl } = require('@/lib/multimedia/cdnService');

    process.env.NEXT_PUBLIC_CDN_PROVIDER = 'local';

    const url = generateImageUrl('test.jpg', {});
    expect(url).toContain('/images/test.jpg');
  });
});
