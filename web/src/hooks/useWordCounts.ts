import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vocavisionbackend-production.up.railway.app/api';

export interface WordCounts {
  total: number;
  exams: Record<string, number>;
  packages: Record<string, number>;
}

const DEFAULT_COUNTS: WordCounts = {
  total: 22336,
  exams: {
    GRE: 4270, SAT: 3910, EBS: 3838, TOEFL: 2893,
    TOEIC: 2356, CSAT: 1792, ACT: 1692, IELTS: 690,
    CSAT_2026: 520, TEPS: 375,
  },
  packages: {
    'gre-complete': 4270, 'sat-complete': 3910, 'ebs-vocab': 3838,
    'toefl-complete': 2893, 'toeic-complete': 2356, 'act-complete': 1692,
    'ielts-complete': 690, '2026-csat-analysis': 520,
  },
};

let _cache: WordCounts | null = null;
let _fetchedAt = 0;
const CACHE_TTL = 3600 * 1000;

export function useWordCounts(): WordCounts {
  const [counts, setCounts] = useState<WordCounts>(_cache || DEFAULT_COUNTS);

  useEffect(() => {
    if (_cache && Date.now() - _fetchedAt < CACHE_TTL) return;

    fetch(`${API_URL}/packages/word-counts`)
      .then(res => res.json())
      .then((data: WordCounts) => {
        _cache = data;
        _fetchedAt = Date.now();
        setCounts(data);
      })
      .catch(() => {}); // 실패 시 DEFAULT_COUNTS 유지
  }, []);

  return counts;
}

/** 서버 컴포넌트용 fetch 함수 */
export async function fetchWordCounts(): Promise<WordCounts> {
  try {
    const res = await fetch(`${API_URL}/packages/word-counts`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Failed');
    return await res.json();
  } catch {
    return DEFAULT_COUNTS;
  }
}
