// Phase 2-6: Graceful Image Component with Fallback
// Handles image loading errors with placeholder

'use client';

import { useState, ImgHTMLAttributes } from 'react';
import Image from 'next/image';

interface GracefulImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  showPlaceholder?: boolean;
  placeholderColor?: string;
  width?: number;
  height?: number;
}

export function GracefulImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  showPlaceholder = true,
  placeholderColor = '#e5e7eb',
  className = '',
  width,
  height,
  ...props
}: GracefulImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    console.warn(`[GracefulImage] Failed to load: ${src}`);
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  // Show placeholder if error and no fallback
  if (error && !fallbackSrc && showPlaceholder) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          backgroundColor: placeholderColor,
          width: width || '100%',
          height: height || '100%',
        }}
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div
          className={`animate-pulse ${className}`}
          style={{
            backgroundColor: placeholderColor,
            width: width || '100%',
            height: height || '100%',
          }}
        />
      )}
      <img
        src={error ? fallbackSrc : src}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={`${className} ${loading ? 'hidden' : ''}`}
        {...props}
      />
    </>
  );
}
