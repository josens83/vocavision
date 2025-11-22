'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Interactive Word Documentation System (n8n style)
 *
 * Provides step-by-step, interactive learning experience inspired by n8n documentation.
 * Each word has 5 learning steps with interactive components, progress tracking,
 * and visual feedback.
 *
 * Features:
 * - Step-by-step navigation
 * - Interactive content blocks
 * - Progress tracking
 * - Visual diagrams and exercises
 * - Real-time feedback
 *
 * @module components/learning/InteractiveWordDoc
 */

/**
 * Learning step types
 */
export type StepType =
  | 'introduction'      // Basic introduction to the word
  | 'visualization'     // Visual learning with images/diagrams
  | 'context'          // Usage in context with examples
  | 'practice'         // Interactive exercises
  | 'mastery';         // Final test and summary

/**
 * Content block types
 */
export type BlockType =
  | 'text'             // Text content
  | 'image'            // Image with caption
  | 'video'            // Video player
  | 'audio'            // Audio pronunciation
  | 'diagram'          // Interactive diagram
  | 'example'          // Example sentence
  | 'quiz'             // Quiz question
  | 'exercise'         // Interactive exercise
  | 'tip'              // Learning tip
  | 'warning'          // Important warning
  | 'success';         // Success message

/**
 * Content block interface
 */
export interface ContentBlock {
  id: string;
  type: BlockType;
  content: any;
  metadata?: {
    title?: string;
    description?: string;
    hint?: string;
    required?: boolean;
  };
}

/**
 * Learning step interface
 */
export interface LearningStep {
  id: string;
  stepNumber: number;
  type: StepType;
  title: string;
  description: string;
  estimatedTime: number; // in minutes
  blocks: ContentBlock[];
  completionCriteria?: {
    minTimeSpent?: number; // seconds
    requiredInteractions?: number;
    quizScore?: number; // percentage
  };
}

/**
 * Interactive word documentation data
 */
export interface InteractiveWordDocData {
  wordId: string;
  word: string;
  definition: string;
  steps: LearningStep[];
  totalEstimatedTime: number;
}

/**
 * Step progress tracking
 */
interface StepProgress {
  stepId: string;
  started: boolean;
  completed: boolean;
  timeSpent: number; // seconds
  score?: number;
  interactions: number;
  completedAt?: Date;
}

interface Props {
  wordId: string;
  data: InteractiveWordDocData;
  onComplete?: (wordId: string, totalTimeSpent: number) => void;
  onStepComplete?: (stepId: string, progress: StepProgress) => void;
}

export default function InteractiveWordDoc({ wordId, data, onComplete, onStepComplete }: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState<Record<string, StepProgress>>({});
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);

  const currentStep = data.steps[currentStepIndex];
  const progress = (currentStepIndex / data.steps.length) * 100;
  const completedSteps = Object.values(stepProgress).filter(p => p.completed).length;

  useEffect(() => {
    // Initialize step progress
    const initialProgress: Record<string, StepProgress> = {};
    data.steps.forEach(step => {
      initialProgress[step.id] = {
        stepId: step.id,
        started: false,
        completed: false,
        timeSpent: 0,
        interactions: 0,
      };
    });
    setStepProgress(initialProgress);
  }, [data.steps]);

  useEffect(() => {
    // Track step start
    if (currentStep) {
      setStepStartTime(Date.now());
      setStepProgress(prev => ({
        ...prev,
        [currentStep.id]: {
          ...prev[currentStep.id],
          started: true,
        },
      }));
    }
  }, [currentStepIndex]);

  const handleNextStep = () => {
    if (currentStepIndex < data.steps.length - 1) {
      markStepComplete();
      setCurrentStepIndex(prev => prev + 1);
    } else {
      markStepComplete();
      handleDocumentComplete();
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      updateStepTime();
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleJumpToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < data.steps.length) {
      updateStepTime();
      setCurrentStepIndex(stepIndex);
    }
  };

  const updateStepTime = () => {
    const timeSpent = Math.floor((Date.now() - stepStartTime) / 1000);
    setStepProgress(prev => ({
      ...prev,
      [currentStep.id]: {
        ...prev[currentStep.id],
        timeSpent: prev[currentStep.id].timeSpent + timeSpent,
      },
    }));
  };

  const markStepComplete = () => {
    updateStepTime();
    const updatedProgress = {
      ...stepProgress[currentStep.id],
      completed: true,
      completedAt: new Date(),
    };

    setStepProgress(prev => ({
      ...prev,
      [currentStep.id]: updatedProgress,
    }));

    onStepComplete?.(currentStep.id, updatedProgress);
  };

  const handleDocumentComplete = () => {
    setIsCompleted(true);
    const totalTimeSpent = Object.values(stepProgress).reduce(
      (sum, progress) => sum + progress.timeSpent,
      0
    );
    onComplete?.(wordId, totalTimeSpent);
  };

  const handleInteraction = (blockId: string) => {
    setStepProgress(prev => ({
      ...prev,
      [currentStep.id]: {
        ...prev[currentStep.id],
        interactions: prev[currentStep.id].interactions + 1,
      },
    }));
  };

  if (isCompleted) {
    return (
      <CompletionScreen
        word={data.word}
        definition={data.definition}
        stepsCompleted={completedSteps}
        totalSteps={data.steps.length}
        totalTimeSpent={Object.values(stepProgress).reduce((sum, p) => sum + p.timeSpent, 0)}
        onRestart={() => {
          setCurrentStepIndex(0);
          setIsCompleted(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Progress Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          {/* Word Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{data.word}</h1>
              <p className="text-gray-600 mt-1">{data.definition}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Step {currentStepIndex + 1} of {data.steps.length}
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {completedSteps}/{data.steps.length} completed
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          {/* Step Navigation Pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {data.steps.map((step, index) => (
              <StepPill
                key={step.id}
                step={step}
                index={index}
                isActive={index === currentStepIndex}
                isCompleted={stepProgress[step.id]?.completed || false}
                onClick={() => handleJumpToStep(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step Header */}
            <div className="bg-white rounded-2xl p-8 mb-6 shadow-lg border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <StepIcon type={currentStep.type} />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {currentStep.title}
                  </h2>
                  <p className="text-lg text-gray-600 mb-4">
                    {currentStep.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <ClockIcon />
                      {currentStep.estimatedTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <BlocksIcon />
                      {currentStep.blocks.length} blocks
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Blocks */}
            <div className="space-y-6">
              {currentStep.blocks.map((block, index) => (
                <ContentBlockRenderer
                  key={block.id}
                  block={block}
                  blockIndex={index}
                  onInteraction={() => handleInteraction(block.id)}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t">
              <button
                onClick={handlePreviousStep}
                disabled={currentStepIndex === 0}
                className="px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                ← Previous
              </button>

              <div className="text-sm text-gray-500">
                {stepProgress[currentStep.id]?.interactions || 0} interactions
              </div>

              <button
                onClick={handleNextStep}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105"
              >
                {currentStepIndex === data.steps.length - 1 ? 'Complete' : 'Next →'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Step pill component for navigation
 */
function StepPill({
  step,
  index,
  isActive,
  isCompleted,
  onClick,
}: {
  step: LearningStep;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : isCompleted
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <div className="flex items-center gap-2">
        {isCompleted && <CheckIcon />}
        <span>{index + 1}. {step.title}</span>
      </div>
    </button>
  );
}

/**
 * Step icon component
 */
function StepIcon({ type }: { type: StepType }) {
  const icons = {
    introduction: '📚',
    visualization: '🎨',
    context: '💡',
    practice: '✏️',
    mastery: '🏆',
  };

  return (
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg">
      {icons[type]}
    </div>
  );
}

/**
 * Content block renderer
 */
function ContentBlockRenderer({
  block,
  blockIndex,
  onInteraction,
}: {
  block: ContentBlock;
  blockIndex: number;
  onInteraction: () => void;
}) {
  const blockComponents = {
    text: TextBlock,
    image: ImageBlock,
    video: VideoBlock,
    audio: AudioBlock,
    diagram: DiagramBlock,
    example: ExampleBlock,
    quiz: QuizBlock,
    exercise: ExerciseBlock,
    tip: TipBlock,
    warning: WarningBlock,
    success: SuccessBlock,
  };

  const BlockComponent = blockComponents[block.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: blockIndex * 0.1 }}
    >
      <BlockComponent block={block} onInteraction={onInteraction} />
    </motion.div>
  );
}

/**
 * Block Components
 */

function TextBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      {block.metadata?.title && (
        <h3 className="text-xl font-bold text-gray-900 mb-3">{block.metadata.title}</h3>
      )}
      <div className="text-gray-700 leading-relaxed prose prose-lg max-w-none">
        {block.content.text}
      </div>
    </div>
  );
}

function ImageBlock({ block, onInteraction }: { block: ContentBlock; onInteraction: () => void }) {
  // Use Next.js Image component for optimization
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <img
        src={block.content.url}
        alt={block.content.alt || ''}
        className="w-full h-auto cursor-pointer hover:opacity-95 transition"
        onClick={onInteraction}
      />
      {block.content.caption && (
        <div className="p-4 bg-gray-50">
          <p className="text-sm text-gray-600">{block.content.caption}</p>
        </div>
      )}
    </div>
  );
}

function VideoBlock({ block, onInteraction }: { block: ContentBlock; onInteraction: () => void }) {
  // Use AutoPlayVideo component for better UX
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <video
        src={block.content.url}
        controls
        autoPlay
        loop
        muted
        className="w-full h-auto"
        onPlay={onInteraction}
      />
      {block.content.caption && (
        <div className="p-4">
          <p className="text-sm text-gray-600">{block.content.caption}</p>
        </div>
      )}
    </div>
  );
}

function AudioBlock({ block, onInteraction }: { block: ContentBlock; onInteraction: () => void }) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white text-2xl">
          🔊
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2">{block.metadata?.title || 'Pronunciation'}</h4>
          <audio
            src={block.content.url}
            controls
            className="w-full"
            onPlay={onInteraction}
          />
        </div>
      </div>
    </div>
  );
}

function DiagramBlock({ block, onInteraction }: { block: ContentBlock; onInteraction: () => void }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h4 className="font-bold text-gray-900 mb-4">{block.metadata?.title || 'Diagram'}</h4>
      {/* Placeholder for diagram - integrate with visualization library */}
      <div
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 border-2 border-dashed border-blue-200 cursor-pointer hover:border-blue-400 transition"
        onClick={onInteraction}
      >
        <div className="text-center text-gray-500">
          Interactive diagram: {block.content.type}
        </div>
      </div>
    </div>
  );
}

function ExampleBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-6">
      <div className="flex items-start gap-3">
        <div className="text-2xl">💬</div>
        <div>
          <p className="text-lg italic text-gray-800 mb-2">"{block.content.sentence}"</p>
          {block.content.translation && (
            <p className="text-gray-600">{block.content.translation}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuizBlock({ block, onInteraction }: { block: ContentBlock; onInteraction: () => void }) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (index: number) => {
    setSelectedAnswer(index);
    setShowResult(true);
    onInteraction();
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border-2 border-purple-200">
      <h4 className="font-bold text-gray-900 mb-4">❓ {block.content.question}</h4>
      <div className="space-y-3">
        {block.content.options.map((option: string, index: number) => {
          const isCorrect = index === block.content.correctIndex;
          const isSelected = index === selectedAnswer;

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : isSelected
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                  : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {showResult && isCorrect && <span className="text-green-600">✓</span>}
                {showResult && isSelected && !isCorrect && <span className="text-red-600">✗</span>}
              </div>
            </button>
          );
        })}
      </div>
      {showResult && (
        <div className={`mt-4 p-4 rounded-lg ${selectedAnswer === block.content.correctIndex ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <p className="text-sm">
            {selectedAnswer === block.content.correctIndex
              ? '🎉 Correct! ' + (block.content.explanation || '')
              : '💡 ' + (block.content.explanation || 'Try again!')}
          </p>
        </div>
      )}
    </div>
  );
}

function ExerciseBlock({ block, onInteraction }: { block: ContentBlock; onInteraction: () => void }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isChecked, setIsChecked] = useState(false);

  const handleCheck = () => {
    setIsChecked(true);
    onInteraction();
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border-2 border-blue-200">
      <h4 className="font-bold text-gray-900 mb-4">✏️ {block.content.prompt}</h4>
      <textarea
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none resize-none"
        rows={4}
      />
      <div className="mt-4">
        <button
          onClick={handleCheck}
          disabled={!userAnswer.trim() || isChecked}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Check Answer
        </button>
      </div>
      {isChecked && block.content.sampleAnswer && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 mb-2">Sample Answer:</p>
          <p className="text-sm text-blue-800">{block.content.sampleAnswer}</p>
        </div>
      )}
    </div>
  );
}

function TipBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl p-6">
      <div className="flex items-start gap-3">
        <div className="text-2xl">💡</div>
        <div>
          <h4 className="font-bold text-yellow-900 mb-2">Tip</h4>
          <p className="text-yellow-800">{block.content.text}</p>
        </div>
      </div>
    </div>
  );
}

function WarningBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 rounded-r-xl p-6">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div>
          <h4 className="font-bold text-red-900 mb-2">Important</h4>
          <p className="text-red-800">{block.content.text}</p>
        </div>
      </div>
    </div>
  );
}

function SuccessBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="bg-green-50 border-l-4 border-green-400 rounded-r-xl p-6">
      <div className="flex items-start gap-3">
        <div className="text-2xl">✅</div>
        <div>
          <h4 className="font-bold text-green-900 mb-2">Success</h4>
          <p className="text-green-800">{block.content.text}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Completion screen
 */
function CompletionScreen({
  word,
  definition,
  stepsCompleted,
  totalSteps,
  totalTimeSpent,
  onRestart,
}: {
  word: string;
  definition: string;
  stepsCompleted: number;
  totalSteps: number;
  totalTimeSpent: number;
  onRestart: () => void;
}) {
  const minutes = Math.floor(totalTimeSpent / 60);
  const seconds = totalTimeSpent % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-12 shadow-2xl max-w-2xl w-full text-center"
      >
        <div className="text-8xl mb-6">🎉</div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Congratulations!</h2>
        <p className="text-xl text-gray-600 mb-8">
          You've mastered <span className="font-bold text-blue-600">{word}</span>!
        </p>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
          <p className="text-lg text-gray-700 mb-4">{definition}</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{stepsCompleted}/{totalSteps}</div>
              <div className="text-sm text-gray-600">Steps Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">100%</div>
              <div className="text-sm text-gray-600">Completion</div>
            </div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105"
        >
          Review Again
        </button>
      </motion.div>
    </div>
  );
}

/**
 * Helper icon components
 */
function ClockIcon() {
  return <span className="text-gray-400">⏱️</span>;
}

function BlocksIcon() {
  return <span className="text-gray-400">📦</span>;
}

function CheckIcon() {
  return <span className="text-green-600">✓</span>;
}
