'use client';

interface QuizOptionsProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export default function QuizOptions({
  options,
  onSelect,
  disabled = false,
}: QuizOptionsProps) {
  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="w-full p-4 bg-white rounded-xl border-2 border-gray-200
                     hover:border-pink-300 hover:bg-pink-50
                     text-left font-medium text-gray-800
                     transition-all active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span
            className="inline-flex items-center justify-center w-7 h-7
                          bg-gray-100 rounded-full text-sm text-gray-500 mr-3"
          >
            {index + 1}
          </span>
          {option}
        </button>
      ))}
    </div>
  );
}
