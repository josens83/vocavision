'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Auto-playing Video Component (GIF-style)
 *
 * Provides auto-playing, looping video content optimized for vocabulary learning.
 * Works like GIFs but with better quality and smaller file sizes.
 *
 * Features:
 * - Auto-play on viewport entry
 * - Looping playback
 * - Muted by default (can be unmuted)
 * - Intersection Observer for performance
 * - Fallback to poster image
 * - Loading states
 *
 * @module components/multimedia/AutoPlayVideo
 */

export interface AutoPlayVideoProps {
  src: string;
  poster?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  onPlay?: () => void;
  onEnded?: () => void;
}

export default function AutoPlayVideo({
  src,
  poster,
  alt,
  caption,
  width,
  height,
  className = '',
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  preload = 'metadata',
  onPlay,
  onEnded,
}: AutoPlayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMutedState, setIsMutedState] = useState(muted);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Intersection Observer for auto-play when in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && autoPlay) {
            video.play().catch((err) => {
              console.warn('Auto-play prevented:', err);
              // Auto-play was prevented, likely due to browser policy
              // User will need to interact to play
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 } // Play when 50% visible
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [autoPlay]);

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMutedState;
      videoRef.current.muted = newMutedState;
      setIsMutedState(newMutedState);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  if (hasError) {
    return (
      <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">🎥</div>
            <div className="text-sm">Video unavailable</div>
          </div>
        </div>
        {poster && (
          <img
            src={poster}
            alt={alt || 'Video poster'}
            className="w-full h-auto opacity-30"
          />
        )}
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="flex flex-col items-center">
            <motion.div
              className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div className="mt-3 text-sm text-gray-600">Loading video...</div>
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        width={width}
        height={height}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        preload={preload}
        playsInline // Important for mobile auto-play
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onLoadedData={handleLoadedData}
        onError={handleError}
        className="w-full h-auto rounded-lg"
        aria-label={alt || caption || 'Auto-playing video'}
      />

      {/* Custom Controls Overlay (when controls=false) */}
      {!controls && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center justify-between">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              )}
            </button>

            {/* Mute/Unmute Button */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition"
              aria-label={isMutedState ? 'Unmute' : 'Mute'}
            >
              {isMutedState ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Caption */}
      {caption && (
        <div className="mt-3 text-sm text-gray-600 text-center">
          {caption}
        </div>
      )}

      {/* Auto-play Indicator */}
      {autoPlay && !controls && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-blue-500/80 text-white text-xs font-medium backdrop-blur-sm">
          Auto-playing
        </div>
      )}
    </div>
  );
}

/**
 * Video Grid Component
 * Display multiple videos in a responsive grid
 */
export function VideoGrid({
  videos,
  columns = 2,
  className = '',
}: {
  videos: Array<{
    src: string;
    poster?: string;
    alt?: string;
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
      {videos.map((video, index) => (
        <AutoPlayVideo
          key={index}
          src={video.src}
          poster={video.poster}
          alt={video.alt}
          caption={video.caption}
        />
      ))}
    </div>
  );
}

/**
 * Video with Synchronized Transcript
 */
export function VideoWithTranscript({
  src,
  poster,
  transcript,
  className = '',
}: {
  src: string;
  poster?: string;
  transcript: Array<{
    time: number;
    text: string;
    translation?: string;
  }>;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTranscript, setCurrentTranscript] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const index = transcript.findIndex(
        (item, i) =>
          currentTime >= item.time &&
          (i === transcript.length - 1 || currentTime < transcript[i + 1].time)
      );
      if (index !== -1) {
        setCurrentTranscript(index);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [transcript]);

  return (
    <div className={`space-y-4 ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        className="w-full rounded-lg"
      />

      {/* Synchronized Transcript */}
      <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
        {transcript.map((item, index) => (
          <div
            key={index}
            className={`p-2 rounded transition-colors ${
              index === currentTranscript ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            <div className="font-medium">{item.text}</div>
            {item.translation && (
              <div className="text-sm text-gray-600 mt-1">{item.translation}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
