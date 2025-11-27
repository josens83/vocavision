/**
 * Multimedia CDN Service
 *
 * Centralized service for managing multimedia content with CDN integration.
 * Supports Cloudinary, Unsplash, and custom CDN providers.
 *
 * Features:
 * - Image optimization and transformation
 * - Video transcoding and streaming
 * - Animation hosting
 * - URL generation with transformations
 * - Caching and performance optimization
 *
 * @module lib/multimedia/cdnService
 */

/**
 * CDN Provider types
 */
export type CDNProvider = 'cloudinary' | 'unsplash' | 'custom' | 'local';

/**
 * Media type enum
 */
export type MediaType = 'image' | 'video' | 'animation' | 'audio';

/**
 * Image transformation options
 */
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'png' | 'jpg' | 'gif';
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
  blur?: number;
  sharpen?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

/**
 * Video transformation options
 */
export interface VideoTransformOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | 'low' | 'medium' | 'high';
  format?: 'mp4' | 'webm' | 'mov';
  fps?: number;
  bitrate?: string;
  startTime?: number; // seconds
  duration?: number; // seconds
}

/**
 * CDN Configuration
 */
export interface CDNConfig {
  provider: CDNProvider;
  cloudName?: string; // Cloudinary cloud name
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string; // Custom CDN base URL
  unsplashAccessKey?: string; // Unsplash API key
}

/**
 * Default CDN configuration
 */
const DEFAULT_CONFIG: CDNConfig = {
  provider: 'local',
  baseUrl: process.env.NEXT_PUBLIC_CDN_URL || '/media',
};

/**
 * CDN Service Class
 */
export class CDNService {
  private config: CDNConfig;

  constructor(config: Partial<CDNConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get optimized image URL
   */
  getImageUrl(
    publicId: string,
    options: ImageTransformOptions = {}
  ): string {
    switch (this.config.provider) {
      case 'cloudinary':
        return this.getCloudinaryImageUrl(publicId, options);
      case 'unsplash':
        return this.getUnsplashImageUrl(publicId, options);
      case 'custom':
        return this.getCustomImageUrl(publicId, options);
      case 'local':
      default:
        return this.getLocalImageUrl(publicId, options);
    }
  }

  /**
   * Get optimized video URL
   */
  getVideoUrl(
    publicId: string,
    options: VideoTransformOptions = {}
  ): string {
    switch (this.config.provider) {
      case 'cloudinary':
        return this.getCloudinaryVideoUrl(publicId, options);
      case 'custom':
        return this.getCustomVideoUrl(publicId, options);
      case 'local':
      default:
        return this.getLocalVideoUrl(publicId, options);
    }
  }

  /**
   * Get animation URL (Lottie JSON or GIF)
   */
  getAnimationUrl(publicId: string): string {
    return `${this.config.baseUrl}/animations/${publicId}`;
  }

  /**
   * Get audio URL
   */
  getAudioUrl(publicId: string): string {
    return `${this.config.baseUrl}/audio/${publicId}`;
  }

  /**
   * Cloudinary image URL with transformations
   */
  private getCloudinaryImageUrl(
    publicId: string,
    options: ImageTransformOptions
  ): string {
    const { cloudName } = this.config;
    if (!cloudName) {
      console.warn('Cloudinary cloud name not configured');
      return publicId;
    }

    const transformations: string[] = [];

    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.gravity) transformations.push(`g_${options.gravity}`);
    if (options.blur) transformations.push(`e_blur:${options.blur}`);
    if (options.sharpen) transformations.push(`e_sharpen:${options.sharpen}`);
    if (options.brightness) transformations.push(`e_brightness:${options.brightness}`);
    if (options.contrast) transformations.push(`e_contrast:${options.contrast}`);
    if (options.saturation) transformations.push(`e_saturation:${options.saturation}`);

    const transformString = transformations.length > 0 ? transformations.join(',') + '/' : '';

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${publicId}`;
  }

  /**
   * Cloudinary video URL with transformations
   */
  private getCloudinaryVideoUrl(
    publicId: string,
    options: VideoTransformOptions
  ): string {
    const { cloudName } = this.config;
    if (!cloudName) {
      console.warn('Cloudinary cloud name not configured');
      return publicId;
    }

    const transformations: string[] = [];

    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);
    if (options.fps) transformations.push(`fps_${options.fps}`);
    if (options.bitrate) transformations.push(`br_${options.bitrate}`);
    if (options.startTime !== undefined) transformations.push(`so_${options.startTime}`);
    if (options.duration !== undefined) transformations.push(`du_${options.duration}`);

    const transformString = transformations.length > 0 ? transformations.join(',') + '/' : '';

    return `https://res.cloudinary.com/${cloudName}/video/upload/${transformString}${publicId}`;
  }

  /**
   * Unsplash image URL with transformations
   */
  private getUnsplashImageUrl(
    photoId: string,
    options: ImageTransformOptions
  ): string {
    const params = new URLSearchParams();

    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.quality) params.append('q', options.quality.toString());
    if (options.format === 'auto') params.append('fm', 'auto');
    if (options.crop) params.append('fit', options.crop);

    const queryString = params.toString();
    const baseUrl = `https://images.unsplash.com/photo-${photoId}`;

    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Custom CDN image URL
   */
  private getCustomImageUrl(
    publicId: string,
    options: ImageTransformOptions
  ): string {
    const { baseUrl } = this.config;
    if (!baseUrl) return publicId;

    // Implement custom CDN URL generation based on your CDN provider's API
    // This is a placeholder implementation
    const params = new URLSearchParams();
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.quality) params.append('q', options.quality.toString());

    const queryString = params.toString();
    return queryString ? `${baseUrl}/${publicId}?${queryString}` : `${baseUrl}/${publicId}`;
  }

  /**
   * Custom CDN video URL
   */
  private getCustomVideoUrl(
    publicId: string,
    options: VideoTransformOptions
  ): string {
    const { baseUrl } = this.config;
    if (!baseUrl) return publicId;

    // Implement custom CDN video URL generation
    return `${baseUrl}/videos/${publicId}`;
  }

  /**
   * Local image URL (development/fallback)
   */
  private getLocalImageUrl(
    publicId: string,
    options: ImageTransformOptions
  ): string {
    // For local development, return the public ID as-is
    // In production, you would use Next.js Image Optimization
    return publicId.startsWith('http') ? publicId : `${this.config.baseUrl}/${publicId}`;
  }

  /**
   * Local video URL (development/fallback)
   */
  private getLocalVideoUrl(
    publicId: string,
    options: VideoTransformOptions
  ): string {
    return publicId.startsWith('http') ? publicId : `${this.config.baseUrl}/videos/${publicId}`;
  }

  /**
   * Generate placeholder image (blur, solid color)
   */
  getPlaceholderUrl(
    width: number = 10,
    height: number = 10,
    color: string = 'f3f4f6'
  ): string {
    // SVG placeholder
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="#${color}"/></svg>`;
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Generate responsive image srcset
   */
  getResponsiveSrcSet(
    publicId: string,
    widths: number[] = [320, 640, 768, 1024, 1280, 1536]
  ): string {
    return widths
      .map((width) => {
        const url = this.getImageUrl(publicId, { width, format: 'auto', quality: 85 });
        return `${url} ${width}w`;
      })
      .join(', ');
  }
}

/**
 * Default CDN service instance
 */
export const cdnService = new CDNService({
  provider: (process.env.NEXT_PUBLIC_CDN_PROVIDER as CDNProvider) || 'local',
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  unsplashAccessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
  baseUrl: process.env.NEXT_PUBLIC_CDN_URL,
});

/**
 * Utility functions
 */

/**
 * Get word image URL
 */
export function getWordImageUrl(
  wordId: string,
  imageId: string,
  options?: ImageTransformOptions
): string {
  return cdnService.getImageUrl(`words/${wordId}/${imageId}`, {
    width: 800,
    quality: 85,
    format: 'auto',
    ...options,
  });
}

/**
 * Get word video URL
 */
export function getWordVideoUrl(
  wordId: string,
  videoId: string,
  options?: VideoTransformOptions
): string {
  return cdnService.getVideoUrl(`words/${wordId}/${videoId}`, {
    quality: 'auto',
    format: 'mp4',
    ...options,
  });
}

/**
 * Get word animation URL (Lottie)
 */
export function getWordAnimationUrl(wordId: string, animationId: string): string {
  return cdnService.getAnimationUrl(`words/${wordId}/${animationId}.json`);
}

/**
 * Get pronunciation audio URL
 */
export function getPronunciationAudioUrl(wordId: string): string {
  return cdnService.getAudioUrl(`pronunciations/${wordId}.mp3`);
}

/**
 * Media asset types for database
 */
export interface MediaAsset {
  id: string;
  type: MediaType;
  publicId: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number; // For videos/audio
  fileSize?: number; // bytes
  format?: string;
  metadata?: Record<string, any>;
}

/**
 * Generate media asset from URL
 */
export function createMediaAsset(
  type: MediaType,
  publicId: string,
  metadata?: Partial<MediaAsset>
): MediaAsset {
  const asset: MediaAsset = {
    id: metadata?.id || `asset_${Date.now()}`,
    type,
    publicId,
    url: '',
    ...metadata,
  };

  // Generate URL based on type
  switch (type) {
    case 'image':
      asset.url = cdnService.getImageUrl(publicId);
      asset.thumbnailUrl = cdnService.getImageUrl(publicId, {
        width: 200,
        height: 200,
        crop: 'thumb',
      });
      break;
    case 'video':
      asset.url = cdnService.getVideoUrl(publicId);
      asset.thumbnailUrl = cdnService.getImageUrl(publicId + '.jpg', {
        width: 200,
        height: 200,
      });
      break;
    case 'animation':
      asset.url = cdnService.getAnimationUrl(publicId);
      break;
    case 'audio':
      asset.url = cdnService.getAudioUrl(publicId);
      break;
  }

  return asset;
}

/**
 * Batch create media assets
 */
export function createMediaAssets(
  assets: Array<{ type: MediaType; publicId: string; metadata?: Partial<MediaAsset> }>
): MediaAsset[] {
  return assets.map((asset) => createMediaAsset(asset.type, asset.publicId, asset.metadata));
}

