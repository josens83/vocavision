/**
 * Admin Batch Image Generation API - Proxy to Railway Backend
 *
 * This route proxies requests to the Railway backend which handles
 * the actual image generation (Vercel serverless can't run background tasks).
 *
 * POST /api/admin/batch-generate-images - Create job (proxied to Railway)
 * GET /api/admin/batch-generate-images?jobId=xxx - Get job status (proxied to Railway)
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

console.log('[BatchGenProxy] Module loaded with config:', {
  apiBase: API_BASE,
  hasAdminKey: !!ADMIN_KEY,
});

interface BatchGenerateRequest {
  wordIds: string[];
  options?: {
    skipExisting?: boolean;
    types?: ('CONCEPT' | 'MNEMONIC' | 'RHYME')[];
  };
}

/**
 * POST handler - Proxy to Railway backend
 * Railway handles the actual image generation in background
 */
export async function POST(request: NextRequest) {
  console.log('[BatchGenProxy] POST - Proxying to Railway backend');

  try {
    const body: BatchGenerateRequest = await request.json();
    const { wordIds, options } = body;

    console.log('[BatchGenProxy] Request:', { wordIds: wordIds?.length, options });

    if (!wordIds || wordIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No word IDs provided' },
        { status: 400 }
      );
    }

    // Proxy to Railway backend
    const railwayUrl = `${API_BASE}/admin/image-jobs`;
    console.log('[BatchGenProxy] Calling Railway:', railwayUrl);

    const response = await fetch(railwayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY,
      },
      body: JSON.stringify({
        wordIds,
        types: options?.types || ['CONCEPT', 'MNEMONIC', 'RHYME'],
      }),
    });

    console.log('[BatchGenProxy] Railway response status:', response.status);

    const result = await response.json();

    if (!response.ok) {
      console.error('[BatchGenProxy] Railway error:', result);
      return NextResponse.json(
        { success: false, error: result.message || 'Failed to create job' },
        { status: response.status }
      );
    }

    console.log('[BatchGenProxy] Job created:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[BatchGenProxy] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start batch generation',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Proxy to Railway backend for job status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: 'Job ID required' },
      { status: 400 }
    );
  }

  try {
    // Proxy to Railway backend
    const railwayUrl = `${API_BASE}/admin/image-jobs/${jobId}`;

    const response = await fetch(railwayUrl, {
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.error || 'Job not found' },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[BatchGenProxy] Error fetching job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}
