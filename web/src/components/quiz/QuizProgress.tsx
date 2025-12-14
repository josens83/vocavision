'use client';

interface QuizProgressProps {
  progress: number;
  showLabel?: boolean;
  current?: number;
  total?: number;
}

export default function QuizProgress({
  progress,
  showLabel = false,
  current,
  total,
}: QuizProgressProps) {
  return (
    <div className="w-full">
      {showLabel && current !== undefined && total !== undefined && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            {current} / {total}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
