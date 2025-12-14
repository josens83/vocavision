'use client';

interface LevelTestProgressProps {
  current: number;
  total: number;
  showLabel?: boolean;
}

export default function LevelTestProgress({
  current,
  total,
  showLabel = true,
}: LevelTestProgressProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            {current} / {total}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
