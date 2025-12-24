'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { decksAPI } from '@/lib/api';

// Benchmarking: Anki-style deck creation
// Phase 2-1: 커스텀 덱 생성 페이지

export default function CreateDeckPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('덱 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const newDeck = await decksAPI.createDeck({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
        tags,
      });

      // Redirect to deck detail page
      router.push(`/decks/${newDeck.id}`);
    } catch (error) {
      console.error('Failed to create deck:', error);
      alert('덱 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">VocaVision AI</h1>
            <nav className="flex gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                대시보드
              </Link>
              <Link href="/decks" className="text-indigo-600 font-semibold">
                덱
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {/* Page Header */}
          <div className="mb-8">
            <Link
              href="/decks"
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> 덱 목록으로 돌아가기
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">새 덱 만들기</h2>
            <p className="text-gray-600">나만의 학습 덱을 만들어 효율적으로 단어를 학습하세요</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Deck Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                덱 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: TOEFL 필수 단어"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{name.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                설명 (선택사항)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 덱에 대한 간단한 설명을 입력하세요"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">태그</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="태그 입력 후 Enter"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-6 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition font-semibold"
                >
                  추가
                </button>
              </div>

              {/* Tag List */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <motion.span
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600 transition"
                      >
                        ×
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}

              {/* Suggested Tags */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">추천 태그:</p>
                <div className="flex flex-wrap gap-2">
                  {['TOEFL', 'TOEIC', 'GRE', 'SAT', '비즈니스', '회화', '초급', '중급', '고급'].map(
                    (suggestedTag) =>
                      !tags.includes(suggestedTag) && (
                        <button
                          key={suggestedTag}
                          type="button"
                          onClick={() => setTags([...tags, suggestedTag])}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition"
                        >
                          + {suggestedTag}
                        </button>
                      )
                  )}
                </div>
              </div>
            </div>

            {/* Public/Private Toggle */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">공개 설정</h3>
                  <p className="text-sm text-gray-600">
                    {isPublic
                      ? '다른 사용자가 이 덱을 검색하고 복사할 수 있습니다'
                      : '나만 볼 수 있는 비공개 덱입니다'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative w-16 h-8 rounded-full transition ${
                    isPublic ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: isPublic ? 32 : 0 }}
                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow"
                  />
                </button>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '생성 중...' : '덱 만들기'}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-4 bg-blue-50 rounded-xl"
          >
            <h3 className="font-semibold text-blue-900 mb-2">💡 덱 사용 팁</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 덱을 만든 후 단어를 추가하여 학습을 시작하세요</li>
              <li>• 태그를 활용하면 나중에 덱을 쉽게 찾을 수 있습니다</li>
              <li>• 공개 덱은 커뮤니티와 공유되어 다른 학습자들에게 도움이 됩니다</li>
              <li>• 간격 반복 학습으로 효율적인 복습을 제공합니다</li>
            </ul>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
