'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Benchmarking: Per-word performance tracking
// Phase 2-2: 단어별 학습 성공률 추적 및 시각화

interface WordStats {
  id: string;
  word: string;
  definition: string;
  attempts: number;
  correct: number;
  accuracy: number;
  lastReviewed: string;
  difficulty: string;
  masteryLevel: 'new' | 'learning' | 'review' | 'mastered';
}

interface WordAccuracyChartProps {
  data?: WordStats[];
  limit?: number;
  sortBy?: 'accuracy' | 'attempts' | 'recent';
  showFilter?: boolean;
}

export default function WordAccuracyChart({
  data,
  limit = 20,
  sortBy = 'accuracy',
  showFilter = true,
}: WordAccuracyChartProps) {
  const [words, setWords] = useState<WordStats[]>([]);
  const [filterBy, setFilterBy] = useState<'all' | 'struggling' | 'improving' | 'mastered'>('all');
  const [sortOption, setSortOption] = useState<'accuracy' | 'attempts' | 'recent'>(sortBy);

  useEffect(() => {
    if (data) {
      setWords(data);
    } else {
      // Mock data for demonstration
      const mockWords: WordStats[] = [
        {
          id: '1',
          word: 'ephemeral',
          definition: '일시적인, 덧없는',
          attempts: 15,
          correct: 13,
          accuracy: 87,
          lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          difficulty: 'ADVANCED',
          masteryLevel: 'review',
        },
        {
          id: '2',
          word: 'ubiquitous',
          definition: '어디에나 있는',
          attempts: 20,
          correct: 18,
          accuracy: 90,
          lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          difficulty: 'ADVANCED',
          masteryLevel: 'mastered',
        },
        {
          id: '3',
          word: 'ameliorate',
          definition: '개선하다',
          attempts: 8,
          correct: 3,
          accuracy: 38,
          lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          difficulty: 'EXPERT',
          masteryLevel: 'learning',
        },
        {
          id: '4',
          word: 'clandestine',
          definition: '비밀의, 은밀한',
          attempts: 12,
          correct: 7,
          accuracy: 58,
          lastReviewed: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          difficulty: 'EXPERT',
          masteryLevel: 'learning',
        },
        {
          id: '5',
          word: 'taciturn',
          definition: '말수가 적은',
          attempts: 18,
          correct: 17,
          accuracy: 94,
          lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          difficulty: 'ADVANCED',
          masteryLevel: 'mastered',
        },
        {
          id: '6',
          word: 'perfunctory',
          definition: '형식적인, 건성의',
          attempts: 10,
          correct: 4,
          accuracy: 40,
          lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          difficulty: 'EXPERT',
          masteryLevel: 'learning',
        },
        {
          id: '7',
          word: 'gregarious',
          definition: '사교적인',
          attempts: 5,
          correct: 4,
          accuracy: 80,
          lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          difficulty: 'INTERMEDIATE',
          masteryLevel: 'review',
        },
        {
          id: '8',
          word: 'pedantic',
          definition: '학자연하는, 잘난 체하는',
          attempts: 14,
          correct: 6,
          accuracy: 43,
          lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
          difficulty: 'ADVANCED',
          masteryLevel: 'learning',
        },
      ];

      setWords(mockWords);
    }
  }, [data]);

  // Filter words
  const filteredWords = words.filter((word) => {
    if (filterBy === 'all') return true;
    if (filterBy === 'struggling') return word.accuracy < 60;
    if (filterBy === 'improving') return word.accuracy >= 60 && word.accuracy < 85;
    if (filterBy === 'mastered') return word.accuracy >= 85;
    return true;
  });

  // Sort words
  const sortedWords = [...filteredWords].sort((a, b) => {
    if (sortOption === 'accuracy') return a.accuracy - b.accuracy;
    if (sortOption === 'attempts') return b.attempts - a.attempts;
    if (sortOption === 'recent')
      return new Date(b.lastReviewed).getTime() - new Date(a.lastReviewed).getTime();
    return 0;
  });

  // Limit results
  const displayWords = sortedWords.slice(0, limit);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 85) return 'from-green-400 to-green-600';
    if (accuracy >= 60) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getAccuracyBadgeColor = (accuracy: number) => {
    if (accuracy >= 85) return 'bg-green-100 text-green-700';
    if (accuracy >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getMasteryIcon = (level: string) => {
    switch (level) {
      case 'new':
        return '🆕';
      case 'learning':
        return '📚';
      case 'review':
        return '🔄';
      case 'mastered':
        return '⭐';
      default:
        return '📖';
    }
  };

  const getMasteryLabel = (level: string) => {
    switch (level) {
      case 'new':
        return '신규';
      case 'learning':
        return '학습중';
      case 'review':
        return '복습';
      case 'mastered':
        return '마스터';
      default:
        return '알 수 없음';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">📈 단어별 성공률</h3>

        {showFilter && (
          <div className="flex gap-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="accuracy">정확도순</option>
              <option value="attempts">학습횟수순</option>
              <option value="recent">최근학습순</option>
            </select>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      {showFilter && (
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: 'all', label: '전체', emoji: '📊' },
            { key: 'struggling', label: '어려움', emoji: '😓' },
            { key: 'improving', label: '향상중', emoji: '📈' },
            { key: 'mastered', label: '마스터', emoji: '⭐' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setFilterBy(filter.key as any)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                filterBy === filter.key
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.emoji} {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <div className="text-2xl font-bold text-green-600">
            {words.filter((w) => w.accuracy >= 85).length}
          </div>
          <div className="text-xs text-gray-600">마스터 (85%+)</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-xl">
          <div className="text-2xl font-bold text-yellow-600">
            {words.filter((w) => w.accuracy >= 60 && w.accuracy < 85).length}
          </div>
          <div className="text-xs text-gray-600">향상중 (60-84%)</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-xl">
          <div className="text-2xl font-bold text-red-600">
            {words.filter((w) => w.accuracy < 60).length}
          </div>
          <div className="text-xs text-gray-600">어려움 (&lt;60%)</div>
        </div>
      </div>

      {/* Word List with Charts */}
      <div className="space-y-3">
        {displayWords.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-gray-600">해당하는 단어가 없습니다.</p>
          </div>
        ) : (
          displayWords.map((word, index) => (
            <motion.div
              key={word.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-gray-50 rounded-xl hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <Link href={`/words/${word.id}`} className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getMasteryIcon(word.masteryLevel)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{word.word}</h4>
                        <span className="text-xs text-gray-500">
                          {getMasteryLabel(word.masteryLevel)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{word.definition}</p>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${getAccuracyBadgeColor(
                        word.accuracy
                      )}`}
                    >
                      {word.accuracy}%
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {word.correct}/{word.attempts}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${word.accuracy}%` }}
                  transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
                  className={`h-full bg-gradient-to-r ${getAccuracyColor(word.accuracy)}`}
                />
              </div>

              {/* Additional Info */}
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>마지막 학습: {getTimeAgo(word.lastReviewed)}</span>
                <span>{word.difficulty}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Insights */}
      {words.filter((w) => w.accuracy < 60).length > 0 && (
        <div className="mt-6 p-4 bg-red-50 rounded-xl border-2 border-red-200">
          <p className="text-sm text-red-900">
            💡 <strong>학습 팁:</strong> 정확도가 낮은 단어는 더 자주 복습하세요. 니모닉(암기법)을
            활용하면 기억에 오래 남습니다.
          </p>
        </div>
      )}

      {words.filter((w) => w.accuracy >= 85).length > 5 && (
        <div className="mt-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
          <p className="text-sm text-green-900">
            🎉 <strong>훌륭합니다!</strong> {words.filter((w) => w.accuracy >= 85).length}개의 단어를
            마스터했습니다. 계속 유지하세요!
          </p>
        </div>
      )}
    </div>
  );
}
