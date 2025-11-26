'use client';

import { useRef, useEffect, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { motion } from 'framer-motion';

/**
 * Lottie Animation Component
 *
 * Displays vector animations for vocabulary learning with interactive controls.
 * Lottie animations are lightweight, scalable, and perfect for educational content.
 *
 * Features:
 * - Auto-play or manual control
 * - Loop control
 * - Speed control
 * - Play/pause/reset
 * - Progress tracking
 * - Responsive sizing
 *
 * @module components/multimedia/LottieAnimation
 */

export interface LottieAnimationProps {
  /**
   * Lottie animation data (JSON)
   * Can be imported JSON or fetched from URL
   */
  animationData: any;

  /**
   * Alternative: URL to fetch animation JSON
   */
  src?: string;

  /**
   * Width of the animation
   */
  width?: number | string;

  /**
   * Height of the animation
   */
  height?: number | string;

  /**
   * Auto-play animation
   */
  autoPlay?: boolean;

  /**
   * Loop animation
   */
  loop?: boolean;

  /**
   * Animation speed (1 = normal, 2 = 2x speed, 0.5 = half speed)
   */
  speed?: number;

  /**
   * Show playback controls
   */
  showControls?: boolean;

  /**
   * Class name for container
   */
  className?: string;

  /**
   * Caption/description
   */
  caption?: string;

  /**
   * Callback when animation completes
   */
  onComplete?: () => void;

  /**
   * Callback when animation starts
   */
  onStart?: () => void;

  /**
   * Play animation on scroll into view
   */
  playOnView?: boolean;
}

export default function LottieAnimation({
  animationData,
  src,
  width = '100%',
  height = 'auto',
  autoPlay = true,
  loop = true,
  speed = 1,
  showControls = false,
  className = '',
  caption,
  onComplete,
  onStart,
  playOnView = false,
}: LottieAnimationProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [loadedData, setLoadedData] = useState(animationData);
  const [isLoading, setIsLoading] = useState(!!src);
  const [error, setError] = useState<string | null>(null);

  // Load animation from URL if src is provided
  useEffect(() => {
    if (src) {
      setIsLoading(true);
      fetch(src)
        .then((res) => res.json())
        .then((data) => {
          setLoadedData(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load Lottie animation:', err);
          setError('Failed to load animation');
          setIsLoading(false);
        });
    }
  }, [src]);

  // Intersection Observer for play on view
  useEffect(() => {
    if (!playOnView || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            lottieRef.current?.play();
            setIsPlaying(true);
          } else {
            lottieRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [playOnView]);

  // Set animation speed
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(speed);
    }
  }, [speed]);

  const handlePlay = () => {
    lottieRef.current?.play();
    setIsPlaying(true);
    onStart?.();
  };

  const handlePause = () => {
    lottieRef.current?.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    lottieRef.current?.stop();
    setIsPlaying(false);
  };

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`}
        style={{ width, height: height === 'auto' ? 200 : height }}
      >
        <motion.div
          className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (error || !loadedData) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`}
        style={{ width, height: height === 'auto' ? 200 : height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">✨</div>
          <div className="text-sm">{error || 'Animation unavailable'}</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative group ${className}`}>
      {/* Lottie Animation */}
      <Lottie
        lottieRef={lottieRef}
        animationData={loadedData}
        loop={loop}
        autoplay={autoPlay}
        style={{ width, height }}
        onComplete={onComplete}
        className="rounded-lg"
      />

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleTogglePlayPause}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              )}
            </button>

            <button
              onClick={handleStop}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition"
              aria-label="Reset"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Caption */}
      {caption && (
        <div className="mt-3 text-sm text-gray-600 text-center">{caption}</div>
      )}
    </div>
  );
}

/**
 * Animated Word Visualization
 * Specifically designed for vocabulary learning
 */
export function AnimatedWordVisualization({
  word,
  animationType = 'typing',
  className = '',
}: {
  word: string;
  animationType?: 'typing' | 'fade' | 'bounce' | 'slide';
  className?: string;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (animationType === 'typing') {
      if (currentIndex < word.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(word.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        }, 100);
        return () => clearTimeout(timeout);
      }
    } else {
      setDisplayedText(word);
    }
  }, [currentIndex, word, animationType]);

  const animations = {
    typing: {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    bounce: {
      initial: { y: -20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
    },
    slide: {
      initial: { x: -20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
    },
  };

  return (
    <motion.div
      className={`text-4xl font-bold text-blue-600 ${className}`}
      {...animations[animationType]}
      transition={{ duration: 0.5 }}
    >
      {displayedText}
      {animationType === 'typing' && currentIndex < word.length && (
        <motion.span
          className="inline-block w-1 h-10 ml-1 bg-blue-600"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

/**
 * Interactive Animation with Hotspots
 * Clickable areas that trigger information popups
 */
export function InteractiveLottieAnimation({
  animationData,
  hotspots,
  className = '',
}: {
  animationData: any;
  hotspots?: Array<{
    x: number; // Percentage (0-100)
    y: number; // Percentage (0-100)
    label: string;
    content: string;
  }>;
  className?: string;
}) {
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  return (
    <div className={`relative ${className}`}>
      <LottieAnimation animationData={animationData} loop autoPlay />

      {/* Hotspots */}
      {hotspots?.map((hotspot, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: `${hotspot.x}%`,
            top: `${hotspot.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <button
            onClick={() => setActiveHotspot(activeHotspot === index ? null : index)}
            className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 transition shadow-lg flex items-center justify-center text-white font-bold"
          >
            +
          </button>

          {/* Popup */}
          {activeHotspot === index && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute left-10 top-0 w-64 bg-white rounded-lg shadow-xl p-4 z-10"
            >
              <h4 className="font-bold text-gray-900 mb-2">{hotspot.label}</h4>
              <p className="text-sm text-gray-600">{hotspot.content}</p>
              <button
                onClick={() => setActiveHotspot(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Animation Gallery
 * Display multiple animations in a grid
 */
export function AnimationGallery({
  animations,
  columns = 3,
  className = '',
}: {
  animations: Array<{
    animationData?: any;
    src?: string;
    caption?: string;
  }>;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {animations.map((animation, index) => (
        <LottieAnimation
          key={index}
          animationData={animation.animationData}
          src={animation.src}
          caption={animation.caption}
          autoPlay
          loop
          width="100%"
          height={200}
        />
      ))}
    </div>
  );
}
