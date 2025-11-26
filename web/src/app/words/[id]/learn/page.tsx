'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import InteractiveWordDoc, {
  type InteractiveWordDocData,
} from '@/components/learning/InteractiveWordDoc';
import { progressAPI } from '@/lib/api';

/**
 * Interactive Word Learning Page
 *
 * n8n-style interactive documentation for learning words.
 * Provides step-by-step guided learning experience.
 *
 * Route: /words/[id]/learn
 */
export default function InteractiveWordLearnPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [docData, setDocData] = useState<InteractiveWordDocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadInteractiveDoc();
  }, [user, params.id]);

  const loadInteractiveDoc = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/words/${params.id}/interactive-doc`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load interactive documentation');
      }

      setDocData(result.data);
    } catch (err) {
      console.error('Failed to load interactive doc:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (wordId: string, totalTimeSpent: number) => {
    console.log('Completed word learning:', { wordId, totalTimeSpent });

    try {
      // Mark word as reviewed
      await progressAPI.submitReview({
        wordId,
        rating: 5, // Perfect score for completing interactive doc
        learningMethod: 'INTERACTIVE_DOC',
      });

      // Show success message
      setTimeout(() => {
        router.push(`/words/${wordId}`);
      }, 3000);
    } catch (err) {
      console.error('Failed to save completion:', err);
    }
  };

  const handleStepComplete = async (stepId: string, progress: any) => {
    console.log('Step completed:', { stepId, progress });

    try {
      // Save step progress
      await fetch(`/api/words/${params.id}/interactive-doc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId,
          timeSpent: progress.timeSpent,
          interactions: progress.interactions,
          score: progress.score,
          completed: progress.completed,
        }),
      });
    } catch (err) {
      console.error('Failed to save step progress:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-700">Loading interactive learning experience...</div>
        </div>
      </div>
    );
  }

  if (error || !docData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Content</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load interactive documentation'}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={loadInteractiveDoc}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
            <Link
              href={`/words/${params.id}`}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Back to Word
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <InteractiveWordDoc
      wordId={params.id}
      data={docData}
      onComplete={handleComplete}
      onStepComplete={handleStepComplete}
    />
  );
}
