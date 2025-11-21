'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { mnemonicsAPI } from '@/lib/api';

// Benchmarking: Memrise-style community mnemonics
// Phase 2-3: 커뮤니티 암기법 시스템 - 투표 및 랭킹

interface Mnemonic {
  id: string;
  wordId: string;
  userId: string;
  userName: string;
  content: string;
  imageUrl?: string;
  upvotes: number;
  downvotes: number;
  netVotes: number;
  userVote?: 'up' | 'down' | null;
  createdAt: string;
}

interface CommunityMnemonicsProps {
  wordId: string;
  wordText: string;
}

export default function CommunityMnemonics({ wordId, wordText }: CommunityMnemonicsProps) {
  const user = useAuthStore((state) => state.user);

  const [mnemonics, setMnemonics] = useState<Mnemonic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [newMnemonicContent, setNewMnemonicContent] = useState('');
  const [newMnemonicImage, setNewMnemonicImage] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMnemonics();
  }, [wordId, sortBy]);

  const loadMnemonics = async () => {
    setLoading(true);
    try {
      const data = await mnemonicsAPI.getMnemonicsForWord(wordId, {
        limit: 50,
        sortBy,
      });
      setMnemonics(data.mnemonics || []);
    } catch (error) {
      console.error('Failed to load mnemonics:', error);
      // Mock data for development
      const mockMnemonics: Mnemonic[] = [
        {
          id: '1',
          wordId,
          userId: 'user1',
          userName: '암기왕',
          content: `"${wordText}"는 "에페메랄"이라고 읽어요. "에페(e)메랄 보석처럼 반짝이지만 일시적"으로 기억하세요!`,
          upvotes: 45,
          downvotes: 3,
          netVotes: 42,
          userVote: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        },
        {
          id: '2',
          wordId,
          userId: 'user2',
          userName: '영단어마스터',
          content: `ephemeral =eph(잎) + emeral(에메랄드) → 나뭇잎처럼 덧없는`,
          imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Leaf',
          upvotes: 28,
          downvotes: 5,
          netVotes: 23,
          userVote: 'up',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        },
        {
          id: '3',
          wordId,
          userId: 'user3',
          userName: '단어덕후',
          content: `"일시적인" 하면 벚꽃이 떠오르죠? 벚꽃의 아름다움은 ephemeral해요.`,
          upvotes: 15,
          downvotes: 2,
          netVotes: 13,
          userVote: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        },
      ];
      setMnemonics(mockMnemonics);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newMnemonicContent.trim()) {
      alert('암기법 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await mnemonicsAPI.submitMnemonic({
        wordId,
        content: newMnemonicContent.trim(),
        imageUrl: newMnemonicImage.trim() || undefined,
      });

      // Reset form
      setNewMnemonicContent('');
      setNewMnemonicImage('');
      setShowSubmitForm(false);

      // Reload mnemonics
      loadMnemonics();
    } catch (error) {
      console.error('Failed to submit mnemonic:', error);
      alert('암기법 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (mnemonicId: string, vote: 'up' | 'down') => {
    try {
      const mnemonic = mnemonics.find((m) => m.id === mnemonicId);
      if (!mnemonic) return;

      // If clicking the same vote, remove it
      if (mnemonic.userVote === vote) {
        await mnemonicsAPI.removeVote(mnemonicId);
      } else {
        await mnemonicsAPI.voteMnemonic(mnemonicId, vote);
      }

      // Reload to get updated vote counts
      loadMnemonics();
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('투표에 실패했습니다.');
    }
  };

  const handleDelete = async (mnemonicId: string) => {
    if (!confirm('이 암기법을 삭제하시겠습니까?')) return;

    try {
      await mnemonicsAPI.deleteMnemonic(mnemonicId);
      loadMnemonics();
    } catch (error) {
      console.error('Failed to delete mnemonic:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (weeks > 0) return `${weeks}주 전`;
    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">💡 커뮤니티 암기법</h3>
          <p className="text-sm text-gray-600">다른 사람들의 암기법을 보고 투표하세요</p>
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent')}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="popular">인기순</option>
            <option value="recent">최신순</option>
          </select>

          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition font-semibold text-sm"
          >
            + 암기법 추가
          </button>
        </div>
      </div>

      {/* Submit Form */}
      <AnimatePresence>
        {showSubmitForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-6 bg-indigo-50 rounded-xl border-2 border-indigo-200"
          >
            <h4 className="font-bold text-indigo-900 mb-4">새 암기법 작성</h4>

            <textarea
              value={newMnemonicContent}
              onChange={(e) => setNewMnemonicContent(e.target.value)}
              placeholder="이 단어를 어떻게 외우시나요? 여러분의 암기법을 공유해주세요!"
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-3"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mb-3">{newMnemonicContent.length}/500</p>

            <input
              type="url"
              value={newMnemonicImage}
              onChange={(e) => setNewMnemonicImage(e.target.value)}
              placeholder="이미지 URL (선택사항)"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowSubmitForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                disabled={submitting}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !newMnemonicContent.trim()}
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '제출 중...' : '제출하기'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mnemonics List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-gray-600">암기법 로딩 중...</p>
        </div>
      ) : mnemonics.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤔</div>
          <p className="text-gray-600 text-lg mb-4">아직 암기법이 없습니다.</p>
          <button
            onClick={() => setShowSubmitForm(true)}
            className="inline-block bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition"
          >
            첫 암기법을 공유해주세요!
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {mnemonics.map((mnemonic, index) => (
            <motion.div
              key={mnemonic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 bg-gray-50 rounded-xl hover:shadow-md transition"
            >
              <div className="flex gap-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleVote(mnemonic.id, 'up')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                      mnemonic.userVote === 'up'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-green-100'
                    }`}
                  >
                    ▲
                  </motion.button>

                  <div
                    className={`text-lg font-bold ${
                      mnemonic.netVotes > 0
                        ? 'text-green-600'
                        : mnemonic.netVotes < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {mnemonic.netVotes}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleVote(mnemonic.id, 'down')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                      mnemonic.userVote === 'down'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-red-100'
                    }`}
                  >
                    ▼
                  </motion.button>
                </div>

                {/* Content Section */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {mnemonic.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{mnemonic.userName}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {getTimeAgo(mnemonic.createdAt)}
                        </span>
                      </div>
                    </div>

                    {user && user.id === mnemonic.userId && (
                      <button
                        onClick={() => handleDelete(mnemonic.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        삭제
                      </button>
                    )}
                  </div>

                  <p className="text-gray-800 mb-3 leading-relaxed">{mnemonic.content}</p>

                  {/* Image */}
                  {mnemonic.imageUrl && (
                    <img
                      src={mnemonic.imageUrl}
                      alt="Mnemonic illustration"
                      className="rounded-lg max-w-sm w-full h-auto mb-3"
                    />
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>👍 {mnemonic.upvotes}</span>
                    <span>👎 {mnemonic.downvotes}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Community Guidelines */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-900">
          💡 <strong>커뮤니티 가이드:</strong> 다른 사람에게 도움이 되는 암기법을 공유해주세요.
          부적절한 내용은 신고될 수 있습니다.
        </p>
      </div>
    </div>
  );
}
