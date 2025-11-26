# Multimedia Content System

**Phase 10-2: GIF, Video, Animation & Optimized Media**

## Overview

The Multimedia Content System provides comprehensive support for rich media content in vocabulary learning. It includes auto-playing videos (GIF-style), Lottie animations, optimized images, and CDN integration for performance.

## Features

### 🎥 Auto-Playing Videos
- GIF-style looping videos with better quality and smaller file sizes
- Intersection Observer for viewport-based auto-play
- Custom playback controls
- Mute/unmute functionality
- Loading states and error handling

### ✨ Lottie Animations
- Lightweight vector animations
- Interactive playback controls
- Speed control (slow-motion, fast-forward)
- Play on scroll into view
- Progress tracking

### 🖼️ Optimized Images
- Next.js Image optimization
- Lazy loading with blur placeholders
- Responsive sizing
- Zoom on click (lightbox)
- CDN integration

### 🌐 CDN Service
- Multi-provider support (Cloudinary, Unsplash, Custom, Local)
- Image transformations (resize, crop, quality, format)
- Video transcoding
- URL generation with parameters
- Caching and performance optimization

## Architecture

### Components

```
web/src/
├── components/multimedia/
│   ├── AutoPlayVideo.tsx          # Auto-playing video component (600+ lines)
│   ├── LottieAnimation.tsx        # Lottie animation component (500+ lines)
│   └── OptimizedImage.tsx         # Optimized image component (500+ lines)
└── lib/multimedia/
    └── cdnService.ts              # CDN integration service (500+ lines)
```

## Component Documentation

### AutoPlayVideo

Auto-playing video component optimized for vocabulary learning.

**Props:**
```typescript
interface AutoPlayVideoProps {
  src: string;              // Video source URL
  poster?: string;          // Poster image
  alt?: string;             // Alt text
  caption?: string;         // Video caption
  width?: number;           // Video width
  height?: number;          // Video height
  autoPlay?: boolean;       // Auto-play (default: true)
  loop?: boolean;           // Loop playback (default: true)
  muted?: boolean;          // Muted (default: true)
  controls?: boolean;       // Show controls (default: false)
  preload?: 'auto' | 'metadata' | 'none';
  onPlay?: () => void;      // Play callback
  onEnded?: () => void;     // End callback
}
```

**Usage:**
```tsx
import AutoPlayVideo from '@/components/multimedia/AutoPlayVideo';

<AutoPlayVideo
  src="/videos/word-example.mp4"
  poster="/images/poster.jpg"
  caption="Example of 'ephemeral' in nature"
  autoPlay
  loop
  muted
/>
```

**Features:**
- ✅ Auto-play when 50% visible (Intersection Observer)
- ✅ Looping playback
- ✅ Custom controls overlay
- ✅ Play/pause/mute buttons
- ✅ Loading skeleton
- ✅ Error fallback
- ✅ Mobile-optimized (`playsInline`)

**Advanced Components:**

1. **VideoGrid**: Display multiple videos
```tsx
<VideoGrid
  videos={[
    { src: '/video1.mp4', caption: 'Example 1' },
    { src: '/video2.mp4', caption: 'Example 2' },
  ]}
  columns={2}
/>
```

2. **VideoWithTranscript**: Synchronized transcripts
```tsx
<VideoWithTranscript
  src="/video.mp4"
  transcript={[
    { time: 0, text: 'Hello', translation: '안녕하세요' },
    { time: 2, text: 'Goodbye', translation: '안녕히 가세요' },
  ]}
/>
```

### LottieAnimation

Lottie vector animation component for interactive learning.

**Props:**
```typescript
interface LottieAnimationProps {
  animationData?: any;      // Lottie JSON data
  src?: string;             // URL to fetch JSON
  width?: number | string;  // Width (default: '100%')
  height?: number | string; // Height (default: 'auto')
  autoPlay?: boolean;       // Auto-play (default: true)
  loop?: boolean;           // Loop (default: true)
  speed?: number;           // Speed (1 = normal, 2 = 2x)
  showControls?: boolean;   // Show controls (default: false)
  caption?: string;         // Caption
  onComplete?: () => void;  // Complete callback
  onStart?: () => void;     // Start callback
  playOnView?: boolean;     // Play on scroll (default: false)
}
```

**Usage:**
```tsx
import LottieAnimation from '@/components/multimedia/LottieAnimation';
import animationData from '@/assets/animations/word-animation.json';

<LottieAnimation
  animationData={animationData}
  autoPlay
  loop
  width={300}
  height={300}
  caption="Word visualization"
/>
```

**Features:**
- ✅ JSON or URL loading
- ✅ Play/pause/reset controls
- ✅ Speed control
- ✅ Play on viewport entry
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive sizing

**Advanced Components:**

1. **AnimatedWordVisualization**: Typed word animation
```tsx
<AnimatedWordVisualization
  word="serendipity"
  animationType="typing"
/>
```

2. **InteractiveLottieAnimation**: Clickable hotspots
```tsx
<InteractiveLottieAnimation
  animationData={data}
  hotspots={[
    { x: 50, y: 30, label: 'Root Word', content: 'From Latin...' },
  ]}
/>
```

3. **AnimationGallery**: Multiple animations grid
```tsx
<AnimationGallery
  animations={[
    { src: '/anim1.json', caption: 'Concept 1' },
    { src: '/anim2.json', caption: 'Concept 2' },
  ]}
  columns={3}
/>
```

### OptimizedImage

Next.js optimized image with CDN integration.

**Props:**
```typescript
interface OptimizedImageProps {
  src: string;              // Image source
  alt: string;              // Alt text (required)
  width?: number;           // Width
  height?: number;          // Height
  caption?: string;         // Image caption
  priority?: boolean;       // Priority loading
  quality?: number;         // Quality (1-100, default: 85)
  fill?: boolean;           // Fill container
  sizes?: string;           // Responsive sizes
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  zoomable?: boolean;       // Zoom on click
  onLoad?: () => void;      // Load callback
  onError?: () => void;     // Error callback
}
```

**Usage:**
```tsx
import OptimizedImage from '@/components/multimedia/OptimizedImage';

<OptimizedImage
  src="https://cdn.example.com/word-image.jpg"
  alt="Visual representation of 'ephemeral'"
  width={800}
  height={600}
  caption="Cherry blossoms - a perfect example of ephemeral beauty"
  zoomable
  quality={90}
/>
```

**Features:**
- ✅ Next.js Image optimization
- ✅ Lazy loading
- ✅ Blur placeholder
- ✅ Loading skeleton
- ✅ Error fallback
- ✅ Click to zoom (lightbox)
- ✅ Responsive sizing

**Advanced Components:**

1. **ImageGallery**: Grid with lightbox
```tsx
<ImageGallery
  images={[
    { src: '/img1.jpg', alt: 'Image 1', caption: 'Caption 1' },
    { src: '/img2.jpg', alt: 'Image 2', caption: 'Caption 2' },
  ]}
  columns={3}
/>
```

2. **BeforeAfterImage**: Comparison slider
```tsx
<BeforeAfterImage
  beforeSrc="/before.jpg"
  afterSrc="/after.jpg"
  beforeLabel="Before"
  afterLabel="After"
/>
```

### CDN Service

Centralized CDN management and URL generation.

**Configuration:**
```typescript
// .env.local
NEXT_PUBLIC_CDN_PROVIDER=cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your-unsplash-key
NEXT_PUBLIC_CDN_URL=https://cdn.example.com
```

**Usage:**
```typescript
import { cdnService } from '@/lib/multimedia/cdnService';

// Get optimized image URL
const imageUrl = cdnService.getImageUrl('words/ephemeral/image1', {
  width: 800,
  height: 600,
  quality: 85,
  format: 'auto',
  crop: 'fill',
  gravity: 'auto',
});

// Get video URL with transformations
const videoUrl = cdnService.getVideoUrl('words/ephemeral/video1', {
  width: 1280,
  height: 720,
  quality: 'auto',
  format: 'mp4',
});

// Get animation URL
const animationUrl = cdnService.getAnimationUrl('words/ephemeral/animation1.json');

// Get pronunciation audio
const audioUrl = cdnService.getAudioUrl('pronunciations/ephemeral.mp3');
```

**Transformation Options:**

**Images:**
```typescript
interface ImageTransformOptions {
  width?: number;           // Width in pixels
  height?: number;          // Height in pixels
  quality?: number;         // Quality (1-100)
  format?: 'auto' | 'webp' | 'png' | 'jpg' | 'gif';
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
  blur?: number;            // Blur radius
  sharpen?: number;         // Sharpen amount
  brightness?: number;      // Brightness (-100 to 100)
  contrast?: number;        // Contrast (-100 to 100)
  saturation?: number;      // Saturation (-100 to 100)
}
```

**Videos:**
```typescript
interface VideoTransformOptions {
  width?: number;           // Width in pixels
  height?: number;          // Height in pixels
  quality?: 'auto' | 'low' | 'medium' | 'high';
  format?: 'mp4' | 'webm' | 'mov';
  fps?: number;             // Frames per second
  bitrate?: string;         // Bitrate (e.g., '1m')
  startTime?: number;       // Start time (seconds)
  duration?: number;        // Duration (seconds)
}
```

**Utility Functions:**
```typescript
import {
  getWordImageUrl,
  getWordVideoUrl,
  getWordAnimationUrl,
  getPronunciationAudioUrl,
} from '@/lib/multimedia/cdnService';

// Get word-specific media URLs
const imageUrl = getWordImageUrl('word_123', 'image_456', {
  width: 800,
  quality: 85,
});

const videoUrl = getWordVideoUrl('word_123', 'video_456');
const animationUrl = getWordAnimationUrl('word_123', 'anim_456');
const audioUrl = getPronunciationAudioUrl('word_123');
```

## CDN Providers

### Cloudinary

**Configuration:**
```env
NEXT_PUBLIC_CDN_PROVIDER=cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
NEXT_PUBLIC_CLOUDINARY_API_SECRET=your-api-secret
```

**Features:**
- Image and video transformations
- AI-powered cropping
- Format conversion
- Quality optimization
- Lazy loading support

**Example URLs:**
```
https://res.cloudinary.com/your-cloud/image/upload/w_800,h_600,q_85,f_auto/words/ephemeral/image1
https://res.cloudinary.com/your-cloud/video/upload/w_1280,h_720,q_auto/words/ephemeral/video1
```

### Unsplash

**Configuration:**
```env
NEXT_PUBLIC_CDN_PROVIDER=unsplash
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your-access-key
```

**Features:**
- High-quality stock photos
- Free for educational use
- Automatic optimization
- Responsive images

**Example URLs:**
```
https://images.unsplash.com/photo-123456?w=800&h=600&q=85&fm=auto
```

### Custom CDN

**Configuration:**
```env
NEXT_PUBLIC_CDN_PROVIDER=custom
NEXT_PUBLIC_CDN_URL=https://cdn.example.com
```

Implement custom URL generation in `cdnService.ts`.

### Local (Development)

**Configuration:**
```env
NEXT_PUBLIC_CDN_PROVIDER=local
NEXT_PUBLIC_CDN_URL=/media
```

Serves media from `/public/media` directory.

## Integration with Interactive Documentation

Update content blocks to use multimedia components:

```typescript
import AutoPlayVideo from '@/components/multimedia/AutoPlayVideo';
import LottieAnimation from '@/components/multimedia/LottieAnimation';
import OptimizedImage from '@/components/multimedia/OptimizedImage';

// In InteractiveWordDoc component
function VideoBlock({ block, onInteraction }) {
  return (
    <AutoPlayVideo
      src={block.content.url}
      caption={block.content.caption}
      autoPlay
      loop
      muted
      onPlay={onInteraction}
    />
  );
}

function ImageBlock({ block, onInteraction }) {
  return (
    <OptimizedImage
      src={block.content.url}
      alt={block.content.alt}
      width={800}
      height={600}
      caption={block.content.caption}
      zoomable
      onClick={onInteraction}
    />
  );
}

function AnimationBlock({ block, onInteraction }) {
  return (
    <LottieAnimation
      src={block.content.url}
      autoPlay
      loop
      width={400}
      height={400}
      caption={block.content.caption}
      onStart={onInteraction}
    />
  );
}
```

## Performance Optimization

### Image Optimization
- Next.js automatic optimization
- WebP format with fallback
- Lazy loading (below fold)
- Blur placeholders
- Responsive sizes
- CDN caching

### Video Optimization
- Auto-play only when visible
- Lazy loading
- Format conversion (MP4, WebM)
- Adaptive bitrate
- Preload metadata only

### Animation Optimization
- Lottie JSON (lightweight)
- Lazy loading
- Play on view
- CPU-efficient rendering

### CDN Caching
- Long cache duration (1 year)
- Immutable URLs
- Edge caching
- Bandwidth savings

## Best Practices

### 1. Image Guidelines
- Use WebP format when possible
- Provide appropriate sizes
- Always include alt text
- Use lazy loading for below-fold images
- Compress images before upload (target: <200KB)

### 2. Video Guidelines
- Keep videos short (10-30 seconds)
- Use MP4 with H.264 codec
- Provide poster images
- Mute by default
- Use auto-play sparingly
- Target file size: <5MB

### 3. Animation Guidelines
- Use Lottie for vector animations
- Keep JSON files small (<100KB)
- Use loops for continuous playback
- Optimize for mobile performance
- Provide static fallback

### 4. Accessibility
- Always provide alt text for images
- Include captions for videos
- Support keyboard controls
- Respect prefers-reduced-motion
- Provide text alternatives

## Examples

### Complete Word Visualization

```tsx
import AutoPlayVideo from '@/components/multimedia/AutoPlayVideo';
import LottieAnimation from '@/components/multimedia/LottieAnimation';
import OptimizedImage from '@/components/multimedia/OptimizedImage';

function WordVisualization({ word }) {
  return (
    <div className="space-y-6">
      {/* Static Image */}
      <OptimizedImage
        src={`/words/${word.id}/image.jpg`}
        alt={`Visual representation of ${word.word}`}
        width={800}
        height={600}
        caption={`Example of "${word.word}" in real life`}
        zoomable
      />

      {/* Auto-playing Video */}
      <AutoPlayVideo
        src={`/words/${word.id}/example.mp4`}
        poster={`/words/${word.id}/poster.jpg`}
        caption={`${word.word} in action`}
        autoPlay
        loop
        muted
      />

      {/* Lottie Animation */}
      <LottieAnimation
        src={`/words/${word.id}/animation.json`}
        caption="Animated concept visualization"
        autoPlay
        loop
        width={400}
        height={400}
      />
    </div>
  );
}
```

## Testing

### Manual Testing Checklist
- [ ] Images load correctly
- [ ] Videos auto-play when visible
- [ ] Animations play smoothly
- [ ] Loading states display
- [ ] Error states handle gracefully
- [ ] Zoom/lightbox works
- [ ] Mobile responsive
- [ ] Accessibility features work

### Performance Testing
- [ ] Lighthouse score > 90
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] FID < 100ms
- [ ] Total page weight < 3MB

## Troubleshooting

**Problem**: Videos don't auto-play
- **Solution**: Ensure `muted` prop is true (browser auto-play policy)

**Problem**: Images not optimizing
- **Solution**: Check Next.js Image configuration, verify CDN setup

**Problem**: Lottie animations laggy
- **Solution**: Reduce complexity, optimize JSON, use smaller dimensions

**Problem**: CDN images not loading
- **Solution**: Verify API keys, check CORS settings, test URLs

## Future Enhancements

### Planned Features
1. **3D Model Viewer** - Three.js integration
2. **AR Visualization** - AR.js for augmented reality
3. **Interactive Diagrams** - D3.js/Mermaid integration
4. **AI-Generated Content** - DALL-E/Stable Diffusion integration
5. **Voice Synthesis** - Web Speech API
6. **Gesture Controls** - Touch gestures for videos
7. **Offline Support** - Service worker caching
8. **Analytics** - View tracking and engagement metrics

## Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "framer-motion": "^10.16.16",
    "lottie-react": "^2.4.0"
  }
}
```

## License

Copyright © 2024 VocaVision. All rights reserved.

---

**Version**: 1.0.0
**Last Updated**: 2024-11-22
**Phase**: 10-2 Multimedia Content System
