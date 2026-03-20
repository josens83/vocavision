import { Metadata } from 'next';
import Link from 'next/link';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// noindex — placeholder page, not yet launched
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Interactive Word Learning Page
 *
 * Placeholder - Feature coming soon
 *
 * Route: /words/[id]/learn
 */
export default function InteractiveWordLearnPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Interactive Learning</h2>
        <p className="text-gray-600 mb-6">
          This feature is currently being updated. Please check back soon!
        </p>
        <Link
          href={`/words/${params.id}`}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Back to Word Detail
        </Link>
      </div>
    </div>
  );
}
