"use client";

import { ReactNode, useCallback, useState } from "react";

export type QuizStatus = "idle" | "selected" | "correct" | "incorrect";

export interface QuizChoiceProps {
  index: number;
  text: string;
  isSelected: boolean;
  isCorrect?: boolean;
  showResult?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface QuizQuestionProps {
  question: string;
  questionNumber?: number;
  totalQuestions?: number;
  hint?: string;
  children: ReactNode;
}

export interface QuizContainerProps {
  children: ReactNode;
  onSubmit?: () => void;
  showSubmit?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
}

const choiceLabels = ["A", "B", "C", "D", "E", "F"];

export function QuizChoice({ index, text, isSelected, isCorrect, showResult = false, disabled = false, onClick }: QuizChoiceProps) {
  const getStyles = useCallback(() => {
    if (showResult) {
      if (isSelected) {
        return isCorrect
          ? { container: "border-feedback-correct bg-green-50", label: "bg-feedback-correct text-white", icon: "correct" }
          : { container: "border-feedback-incorrect bg-red-50", label: "bg-feedback-incorrect text-white", icon: "incorrect" };
      }
      if (isCorrect) {
        return { container: "border-feedback-correct bg-green-50/50", label: "bg-feedback-correct/80 text-white", icon: "correct" };
      }
      return { container: "border-surface-border bg-white opacity-60", label: "bg-slate-100 text-slate-400", icon: null };
    }
    if (isSelected) {
      return { container: "border-feedback-selected bg-blue-50", label: "bg-feedback-selected text-white", icon: null };
    }
    return { container: "border-surface-border bg-white hover:border-slate-300 hover:bg-slate-50", label: "bg-slate-100 text-slate-600 group-hover:bg-slate-200", icon: null };
  }, [isSelected, isCorrect, showResult]);

  const styles = getStyles();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || showResult}
      className={`group quiz-choice w-full flex items-stretch rounded-xl border-2 overflow-hidden transition-all duration-200 ease-out ${styles.container} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${!disabled && !showResult ? "active:scale-[0.99]" : ""}`}
    >
      <span className={`quiz-choice__label w-14 min-h-[3.5rem] flex items-center justify-center font-display font-bold text-lg border-r border-surface-border transition-colors duration-200 ${styles.label}`}>
        {styles.icon === "correct" ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        ) : styles.icon === "incorrect" ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          choiceLabels[index]
        )}
      </span>
      <span className="quiz-choice__text flex-1 p-4 text-left text-slate-700">{text}</span>
      {isSelected && !showResult && (
        <span className="flex items-center pr-4">
          <span className="w-6 h-6 rounded-full bg-feedback-selected flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </span>
        </span>
      )}
    </button>
  );
}

export function QuizQuestion({ question, questionNumber, totalQuestions, hint, children }: QuizQuestionProps) {
  return (
    <div className="space-y-6">
      {questionNumber && totalQuestions && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">문제 {questionNumber} / {totalQuestions}</span>
          <div className="flex-1 max-w-xs ml-4">
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <h2 className="text-xl font-display font-semibold text-slate-900 leading-relaxed">{question}</h2>
        {hint && (
          <p className="mt-3 text-sm text-slate-500 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{hint}</span>
          </p>
        )}
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function QuizContainer({ children, onSubmit, showSubmit = true, submitDisabled = false, submitLabel = "정답 확인" }: QuizContainerProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8">
        {children}
        {showSubmit && onSubmit && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <button onClick={onSubmit} disabled={submitDisabled} className={`w-full btn btn-primary py-4 text-lg font-semibold ${submitDisabled ? "opacity-50 cursor-not-allowed" : ""}`}>
              {submitLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface QuizFeedbackProps {
  isCorrect: boolean;
  correctAnswer?: string;
  explanation?: string;
  onNext?: () => void;
  onRetry?: () => void;
}

export function QuizFeedback({ isCorrect, correctAnswer, explanation, onNext, onRetry }: QuizFeedbackProps) {
  return (
    <div className={`mt-6 p-6 rounded-xl border-2 ${isCorrect ? "bg-green-50 border-feedback-correct" : "bg-red-50 border-feedback-incorrect"} animate-fade-in`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCorrect ? "bg-feedback-correct" : "bg-feedback-incorrect"}`}>
          {isCorrect ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          )}
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${isCorrect ? "text-green-800" : "text-red-800"}`}>
            {isCorrect ? "정답입니다!" : "아쉽네요"}
          </h3>
          {!isCorrect && correctAnswer && <p className="text-sm text-red-700">정답: <strong>{correctAnswer}</strong></p>}
        </div>
      </div>

      {explanation && <p className={`text-sm ${isCorrect ? "text-green-700" : "text-red-700"} mb-4`}>{explanation}</p>}

      <div className="flex gap-3">
        {onNext && (
          <button onClick={onNext} className={`flex-1 btn ${isCorrect ? "bg-feedback-correct hover:bg-green-600 text-white" : "bg-feedback-incorrect hover:bg-red-600 text-white"}`}>
            다음 문제
          </button>
        )}
        {!isCorrect && onRetry && <button onClick={onRetry} className="btn btn-ghost border border-red-200">다시 풀기</button>}
      </div>
    </div>
  );
}

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface UseQuizOptions {
  options: QuizOption[];
  onAnswer?: (isCorrect: boolean, selectedId: string) => void;
}

export function useQuiz({ options, onAnswer }: UseQuizOptions) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const selectOption = useCallback((id: string) => {
    if (!showResult) setSelectedId(id);
  }, [showResult]);

  const checkAnswer = useCallback(() => {
    if (!selectedId) return;
    const selected = options.find(opt => opt.id === selectedId);
    const correct = selected?.isCorrect ?? false;
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer?.(correct, selectedId);
  }, [selectedId, options, onAnswer]);

  const reset = useCallback(() => {
    setSelectedId(null);
    setShowResult(false);
    setIsCorrect(false);
  }, []);

  return {
    selectedId,
    showResult,
    isCorrect,
    selectOption,
    checkAnswer,
    reset,
    isOptionSelected: (id: string) => selectedId === id,
    isOptionCorrect: (id: string) => options.find(opt => opt.id === id)?.isCorrect ?? false,
  };
}

export function QuizDemo() {
  const options = [
    { id: "1", text: "To make something clear or easy to understand", isCorrect: true },
    { id: "2", text: "To make something complicated", isCorrect: false },
    { id: "3", text: "To hide information from others", isCorrect: false },
    { id: "4", text: "To forget important details", isCorrect: false },
  ];

  const { selectedId, showResult, isCorrect, selectOption, checkAnswer, reset, isOptionSelected, isOptionCorrect } = useQuiz({ options });

  return (
    <QuizContainer onSubmit={showResult ? reset : checkAnswer} submitDisabled={!selectedId && !showResult} submitLabel={showResult ? "다시 풀기" : "정답 확인"}>
      <QuizQuestion question="What does 'elucidate' mean?" questionNumber={1} totalQuestions={10} hint="Think about making things clearer">
        {options.map((option, index) => (
          <QuizChoice
            key={option.id}
            index={index}
            text={option.text}
            isSelected={isOptionSelected(option.id)}
            isCorrect={isOptionCorrect(option.id)}
            showResult={showResult}
            onClick={() => selectOption(option.id)}
          />
        ))}
      </QuizQuestion>

      {showResult && (
        <QuizFeedback
          isCorrect={isCorrect}
          correctAnswer={options.find(o => o.isCorrect)?.text}
          explanation="'Elucidate' comes from Latin 'elucidare' meaning 'to make light'. It means to make something clear by explaining it in more detail."
        />
      )}
    </QuizContainer>
  );
}
