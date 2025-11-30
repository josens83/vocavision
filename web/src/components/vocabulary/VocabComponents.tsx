"use client";

import { ReactNode } from "react";

// ============================================
// Color Constants
// ============================================

export const vocabColors = {
  vocabulary: "#ff6699",
  vocabularyLight: "#fee2eb",
  success: "#50af31",
  successLight: "#d0e9ce",
  white: "#ffffff",
  gray: "#4d4d4d",
  grayMid: "#838383",
  grayLight: "#f5f5f5",
  grayDark: "#353535",
  greyblue: "#37424e",
};

// ============================================
// Tab Button Component
// ============================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  color?: string;
}

export function TabButton({
  active,
  onClick,
  children,
  color = vocabColors.vocabulary
}: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-semibold text-sm rounded-t-lg transition-all ${
        active
          ? "bg-white text-gray-700 border-2 border-gray-100 border-b-0 relative top-0.5"
          : "text-white hover:opacity-90"
      }`}
      style={{
        backgroundColor: active ? vocabColors.white : color,
      }}
    >
      {children}
    </button>
  );
}

// ============================================
// Tab Container Component
// ============================================

interface TabContainerProps {
  children: ReactNode;
}

export function TabContainer({ children }: TabContainerProps) {
  return (
    <div className="bg-white border-2 border-gray-100 rounded-b-lg rounded-tr-lg min-h-96">
      {children}
    </div>
  );
}

// ============================================
// Number Badge Component
// ============================================

type BadgeVariant = "filled" | "outline";

interface NumberBadgeProps {
  number: number;
  variant?: BadgeVariant;
  color?: string;
  size?: "sm" | "md" | "lg";
}

export function NumberBadge({
  number,
  variant = "filled",
  color = vocabColors.vocabulary,
  size = "md"
}: NumberBadgeProps) {
  const sizeClasses = {
    sm: "w-5 h-5 text-xs",
    md: "w-7 h-7 text-sm",
    lg: "w-9 h-9 text-base",
  };

  if (variant === "outline") {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border-2 font-bold ${sizeClasses[size]}`}
        style={{ borderColor: color, color: color }}
      >
        {number}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full text-white font-bold ${sizeClasses[size]}`}
      style={{ backgroundColor: color }}
    >
      {number}
    </span>
  );
}

// ============================================
// Vocab Select (Dropdown) Component
// ============================================

interface VocabSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function VocabSelect({
  options,
  value,
  onChange,
  placeholder = "선택하세요...",
  disabled = false
}: VocabSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="mx-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 min-w-32 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

// ============================================
// Quiz Question Component
// ============================================

interface QuizQuestionProps {
  number: number;
  prefix?: string;
  suffix: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  correctAnswer?: string;
  showResult?: boolean;
}

export function QuizQuestion({
  number,
  prefix = "",
  suffix,
  options,
  value,
  onChange,
  correctAnswer,
  showResult = false
}: QuizQuestionProps) {
  const isCorrect = correctAnswer && value === correctAnswer;
  const isIncorrect = showResult && value && correctAnswer && value !== correctAnswer;

  return (
    <div className="py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center flex-wrap gap-1">
        <NumberBadge number={number} />
        {prefix && <span className="ml-2 text-gray-700">{prefix}</span>}
        <VocabSelect options={options} value={value} onChange={onChange} />
        <span className="text-gray-700">{suffix}</span>
      </div>
      {showResult && value && (
        <div className={`mt-2 ml-9 text-sm font-medium flex items-center gap-1 ${
          isCorrect ? "text-green-600" : "text-red-500"
        }`}>
          {isCorrect ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              정답입니다!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              오답입니다 (정답: {correctAnswer})
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Vocab Image Card Component
// ============================================

interface VocabImageCardProps {
  number: number;
  image: string;
  label: string;
  onClick?: () => void;
}

export function VocabImageCard({ number, image, label, onClick }: VocabImageCardProps) {
  return (
    <div
      className={`flex flex-col items-center ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="relative group">
        <div
          className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold z-10"
          style={{ backgroundColor: vocabColors.vocabulary }}
        >
          {number}
        </div>
        <div className="w-24 h-20 bg-gray-200 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
          <img src={image} alt={label} className="w-full h-full object-cover" />
        </div>
      </div>
      <span className="mt-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">
        {label}
      </span>
    </div>
  );
}

// ============================================
// Example Sentence Component
// ============================================

interface ExampleSentenceProps {
  number: number;
  sentence: string;
  keyword: string;
  keywordColor?: string;
}

export function ExampleSentence({
  number,
  sentence,
  keyword,
  keywordColor = vocabColors.success
}: ExampleSentenceProps) {
  // Split sentence by {keyword} placeholder
  const placeholder = `{${keyword}}`;
  const parts = sentence.includes(placeholder)
    ? sentence.split(placeholder)
    : [sentence.replace(keyword, ""), ""];

  return (
    <li className="py-2 flex items-start gap-2">
      <span className="text-gray-400 mt-0.5">‣</span>
      <span className="text-gray-700 leading-relaxed">
        {parts[0]}
        <NumberBadge number={number} variant="outline" size="sm" />
        <span className="font-bold ml-1" style={{ color: keywordColor }}>
          {keyword}
        </span>
        {parts[1]}
      </span>
    </li>
  );
}

// ============================================
// Related Test Card Component
// ============================================

interface RelatedTestCardProps {
  image: string;
  title: string;
  href?: string;
  onClick?: () => void;
}

export function RelatedTestCard({ image, title, href, onClick }: RelatedTestCardProps) {
  const content = (
    <>
      <img src={image} alt={title} className="w-full h-20 object-cover" />
      <div className="p-3">
        <p className="text-sm text-gray-700 leading-tight line-clamp-2">{title}</p>
      </div>
    </>
  );

  const className = "bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer block";

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <div className={className} onClick={onClick}>
      {content}
    </div>
  );
}

// ============================================
// Pagination Component
// ============================================

interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
  label?: string;
  color?: string;
}

export function Pagination({
  current,
  total,
  onChange,
  label = "Exercises:",
  color = vocabColors.vocabulary
}: PaginationProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 text-sm">{label}</span>
      {Array.from({ length: total }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          onClick={() => onChange(num)}
          className={`w-8 h-8 rounded-lg font-medium text-sm transition-all ${
            num === current
              ? "text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
          }`}
          style={{
            backgroundColor: num === current ? color : undefined,
          }}
        >
          {num}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Breadcrumb Component
// ============================================

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  color?: string;
}

export function Breadcrumb({ items, color = vocabColors.vocabulary }: BreadcrumbProps) {
  return (
    <nav className="px-4 py-2 text-sm flex items-center flex-wrap">
      {items.map((item, index) => (
        <span key={index} className="flex items-center">
          {index > 0 && <span className="mx-2 text-gray-400">/</span>}
          {item.href ? (
            <a href={item.href} style={{ color }} className="hover:underline">
              {item.label}
            </a>
          ) : (
            <span className="text-gray-500">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ============================================
// Content Header Component
// ============================================

interface ContentHeaderProps {
  title: string;
  color?: string;
}

export function ContentHeader({ title, color = vocabColors.vocabulary }: ContentHeaderProps) {
  return (
    <header
      className="py-3 px-4 text-center text-white font-bold uppercase tracking-wide"
      style={{ backgroundColor: color }}
    >
      {title}
    </header>
  );
}

// ============================================
// Instruction Box Component
// ============================================

interface InstructionBoxProps {
  children: ReactNode;
}

export function InstructionBox({ children }: InstructionBoxProps) {
  return (
    <div
      className="rounded-lg p-4 mb-6"
      style={{
        backgroundColor: '#ECEFF3',
        border: '1px solid #CCC',
        borderRadius: '8px',
      }}
    >
      <p className="text-gray-700 font-medium text-base">{children}</p>
    </div>
  );
}

// ============================================
// Section Divider Component
// ============================================

interface SectionDividerProps {
  label?: string;
  color?: string;
}

export function SectionDivider({ label, color = vocabColors.vocabulary }: SectionDividerProps) {
  if (!label) {
    return <hr className="my-6 border-gray-200" />;
  }

  return (
    <div className="flex items-center justify-center my-8">
      <div className="flex-1 border-b border-dotted" style={{ borderColor: color }} />
      <span className="px-4 text-sm font-medium" style={{ color }}>
        {label}
      </span>
      <div className="flex-1 border-b border-dotted" style={{ borderColor: color }} />
    </div>
  );
}

// ============================================
// Social Share Buttons Component
// ============================================

const socialColors: Record<string, string> = {
  facebook: "#3b5998",
  twitter: "#111",
  linkedin: "#0077b5",
  email: "#777",
  whatsapp: "#25D366",
  kakao: "#FEE500",
};

interface SocialShareProps {
  platforms?: string[];
  url?: string;
  title?: string;
}

export function SocialShare({
  platforms = ["facebook", "twitter", "kakao", "email"],
  url,
  title
}: SocialShareProps) {
  const handleShare = (platform: string) => {
    const shareUrl = url || window.location.href;
    const shareTitle = title || document.title;

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      email: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`,
      kakao: `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <div className="flex justify-center gap-3">
      {platforms.map((platform) => (
        <button
          key={platform}
          onClick={() => handleShare(platform)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
          style={{
            backgroundColor: socialColors[platform] || "#666",
            color: platform === "kakao" ? "#3C1E1E" : "white",
          }}
          title={platform}
        >
          <span className="text-xs font-bold uppercase">{platform[0]}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================
// Video Player Placeholder Component
// ============================================

interface VideoPlayerProps {
  youtubeId?: string;
  videoUrl?: string;
  posterUrl?: string;
  borderColor?: string;
}

export function VideoPlayer({
  youtubeId,
  videoUrl,
  posterUrl,
  borderColor = "#fecc00"
}: VideoPlayerProps) {
  if (youtubeId) {
    return (
      <div
        className="w-full max-w-xl rounded-lg overflow-hidden"
        style={{ border: `4px solid ${borderColor}` }}
      >
        <div className="relative aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="Video Player"
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div
        className="w-full max-w-xl rounded-lg overflow-hidden"
        style={{ border: `4px solid ${borderColor}` }}
      >
        <video
          src={videoUrl}
          poster={posterUrl}
          controls
          className="w-full aspect-video"
        />
      </div>
    );
  }

  // Placeholder
  return (
    <div
      className="w-full max-w-xl rounded-lg overflow-hidden"
      style={{ border: `4px solid ${borderColor}` }}
    >
      <div className="bg-gray-800 aspect-video flex items-center justify-center">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors">
          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
