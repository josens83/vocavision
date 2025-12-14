/**
 * PronunciationButton - 발음 듣기 버튼
 *
 * Free Dictionary API를 사용하여 단어 발음을 재생
 * 플래시카드, 퀴즈 화면에서 사용
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { pronunciationAPI } from '@/lib/api';

interface PronunciationButtonProps {
  word: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showPhonetic?: boolean;
  className?: string;
}

export default function PronunciationButton({
  word,
  size = 'md',
  variant = 'default',
  showPhonetic = false,
  className = '',
}: PronunciationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [phonetic, setPhonetic] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, { audioUrl: string | null; phonetic: string | null }>>(new Map());

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const variantClasses = {
    default: 'bg-blue-500 hover:bg-blue-600 text-white shadow-md',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600',
    outline: 'bg-white border-2 border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-500',
  };

  const playPronunciation = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(false);

    try {
      // Check cache first
      let data = cacheRef.current.get(word);

      if (!data) {
        // Fetch from API
        data = await pronunciationAPI.getPronunciation(word);
        cacheRef.current.set(word, data);
      }

      if (showPhonetic && data.phonetic) {
        setPhonetic(data.phonetic);
      }

      if (!data.audioUrl) {
        setError(true);
        return;
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Play new audio
      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;

      await audio.play();
    } catch (err) {
      console.error('Failed to play pronunciation:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [word, isLoading, showPhonetic]);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={playPronunciation}
        disabled={isLoading}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          rounded-full flex items-center justify-center
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-95
        `}
        title={error ? '발음을 불러올 수 없습니다' : '발음 듣기'}
        aria-label={`${word} 발음 듣기`}
      >
        {isLoading ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : error ? (
          <VolumeX className={iconSizes[size]} />
        ) : (
          <Volume2 className={iconSizes[size]} />
        )}
      </button>

      {showPhonetic && phonetic && (
        <span className="text-sm text-gray-500 font-mono">
          {phonetic}
        </span>
      )}
    </div>
  );
}

// Hook for pronunciation functionality
export function usePronunciation() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string | null>>(new Map());

  const play = useCallback(async (word: string): Promise<boolean> => {
    try {
      setIsPlaying(true);
      setCurrentWord(word);

      // Check cache
      let audioUrl = cacheRef.current.get(word);

      if (audioUrl === undefined) {
        const data = await pronunciationAPI.getPronunciation(word);
        audioUrl = data.audioUrl;
        cacheRef.current.set(word, audioUrl);
      }

      if (!audioUrl) {
        setIsPlaying(false);
        return false;
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentWord(null);
      };

      await audio.play();
      return true;
    } catch {
      setIsPlaying(false);
      setCurrentWord(null);
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentWord(null);
  }, []);

  return { play, stop, isPlaying, currentWord };
}
