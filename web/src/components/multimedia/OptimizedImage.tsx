'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

/**
 * Optimized Image Component
 *
 * Provides optimized images with lazy loading, blur placeholders,
 * and responsive sizing. Integrates with CDNs like Cloudinary or Unsplash.
 *
 * Features:
 * - Next.js Image optimization
 * - Lazy loading
 * - Blur placeholder
 * - Responsive sizing
 * - Error handling
 * - Loading states
 * - CDN integration
 * - Image zoom on click (optional)
 *
 * @module components/multimedia/OptimizedImage
 */

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
  priority?: boolean;
  quality?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  zoomable?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  caption,
  priority = false,
  quality = 85,
  fill = false,
  sizes,
  className = '',
  objectFit = 'cover',
  zoomable = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const handleImageClick = () => {
    if (zoomable) {
      setIsZoomed(true);
    }
  };

  if (hasError) {
    return (
      <div
        className={`relative bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          minHeight: height || 200,
        }}
      >
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🖼️</div>
          <div className="text-sm">Image unavailable</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        {/* Loading Skeleton */}
        {isLoading && (
          <div
            className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg z-10"
            style={{
              width: fill ? '100%' : width,
              height: fill ? '100%' : height || 200,
            }}
          />
        )}

        {/* Image */}
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width || 800}
          height={fill ? undefined : height || 600}
          fill={fill}
          priority={priority}
          quality={quality}
          sizes={sizes || (fill ? '100vw' : undefined)}
          className={`rounded-lg ${
            zoomable ? 'cursor-zoom-in' : ''
          } ${objectFit ? `object-${objectFit}` : ''} ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          onClick={handleImageClick}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
        />

        {/* Caption */}
        {caption && (
          <div className="mt-3 text-sm text-gray-600 text-center">{caption}</div>
        )}

        {/* Zoom indicator */}
        {zoomable && !isLoading && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-2 rounded-full bg-black/50 backdrop-blur-sm">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Zoomed Modal */}
      {isZoomed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="relative max-w-7xl max-h-full"
          >
            <Image
              src={src}
              alt={alt}
              width={1920}
              height={1080}
              quality={95}
              className="object-contain max-h-screen"
            />
            {caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-center">
                {caption}
              </div>
            )}
          </motion.div>

          {/* Close Button */}
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </motion.div>
      )}
    </>
  );
}

/**
 * Image Gallery with Lightbox
 */
export function ImageGallery({
  images,
  columns = 3,
  className = '',
}: {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const goToNext = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % images.length);
    }
  };

  const goToPrevious = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + images.length) % images.length);
    }
  };

  return (
    <>
      <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
        {images.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-lg group"
            onClick={() => setSelectedImage(index)}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {image.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Main Image */}
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-7xl max-h-full"
            >
              <Image
                src={images[selectedImage].src}
                alt={images[selectedImage].alt}
                width={1920}
                height={1080}
                quality={95}
                className="object-contain max-h-screen"
              />
              {images[selectedImage].caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-center">
                  {images[selectedImage].caption}
                </div>
              )}
            </motion.div>

            {/* Navigation */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm">
              {selectedImage + 1} / {images.length}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

/**
 * Before/After Image Comparison
 * Useful for showing word usage transformation or visual learning
 */
export function BeforeAfterImage({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className = '',
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  return (
    <div
      className={`relative select-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Before Image (Background) */}
      <div className="relative w-full aspect-video">
        <Image
          src={beforeSrc}
          alt={beforeLabel}
          fill
          className="object-cover rounded-lg"
        />
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full backdrop-blur-sm">
          {beforeLabel}
        </div>
      </div>

      {/* After Image (Overlay) */}
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={afterSrc}
          alt={afterLabel}
          fill
          className="object-cover rounded-lg"
        />
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full backdrop-blur-sm">
          {afterLabel}
        </div>
      </div>

      {/* Slider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0zM7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
