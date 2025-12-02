// ============================================
// VocaVision Admin Dashboard - Word Form & Modals
// ============================================

'use client';

import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Select,
  Textarea,
  Checkbox,
  Modal,
  Card,
  Badge,
  Alert,
  ProgressBar,
  Spinner,
} from './ui';
import {
  VocaWord,
  VocaContentFull,
  CreateWordForm,
  BatchCreateForm,
  ReviewForm,
  ExamCategory,
  DifficultyLevel,
  EXAM_CATEGORY_LABELS,
  LEVEL_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  LEVEL_COLORS,
} from './types/admin.types';
import {
  useWordMutations,
  useContentGeneration,
  useReview,
  useWordDetail,
} from './hooks/useAdminApi';

// ---------------------------------------------
// Word Form Modal
// ---------------------------------------------
interface WordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editWord?: VocaWord | null;
  onSuccess: () => void;
}

export const WordFormModal: React.FC<WordFormModalProps> = ({
  isOpen,
  onClose,
  editWord,
  onSuccess,
}) => {
  const { createWord, updateWord, loading, error } = useWordMutations();

  const [form, setForm] = useState<CreateWordForm>({
    word: '',
    examCategories: [],
    level: 'B1',
    topics: [],
    generateContent: false,
  });

  const [topicInput, setTopicInput] = useState('');

  // Reset form when modal opens/closes or editWord changes
  useEffect(() => {
    if (editWord) {
      setForm({
        word: editWord.word,
        examCategories: editWord.examCategories,
        level: editWord.level,
        topics: editWord.topics,
        generateContent: false,
      });
    } else {
      setForm({
        word: '',
        examCategories: [],
        level: 'B1',
        topics: [],
        generateContent: false,
      });
    }
  }, [editWord, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editWord) {
        await updateWord(editWord.id, form);
      } else {
        await createWord(form);
      }
      onSuccess();
      onClose();
    } catch {
      // Error is handled by the hook
    }
  };

  const toggleExamCategory = (cat: ExamCategory) => {
    setForm((prev) => ({
      ...prev,
      examCategories: prev.examCategories.includes(cat)
        ? prev.examCategories.filter((c) => c !== cat)
        : [...prev.examCategories, cat],
    }));
  };

  const addTopic = () => {
    if (topicInput.trim() && !form.topics.includes(topicInput.trim())) {
      setForm((prev) => ({
        ...prev,
        topics: [...prev.topics, topicInput.trim()],
      }));
      setTopicInput('');
    }
  };

  const removeTopic = (topic: string) => {
    setForm((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t !== topic),
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editWord ? '단어 수정' : '새 단어 추가'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert type="error" title="오류">
            {error}
          </Alert>
        )}

        {/* Word Input */}
        <Input
          label="단어"
          placeholder="영어 단어 입력"
          value={form.word}
          onChange={(e) => setForm({ ...form, word: e.target.value })}
          disabled={!!editWord}
          required
        />

        {/* Exam Categories */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            시험 카테고리 *
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EXAM_CATEGORY_LABELS) as ExamCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleExamCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  form.examCategories.includes(cat)
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {EXAM_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            난이도 *
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LEVEL_LABELS) as DifficultyLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setForm({ ...form, level })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  form.level === level
                    ? 'text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={
                  form.level === level
                    ? { backgroundColor: LEVEL_COLORS[level] }
                    : {}
                }
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            토픽 태그
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="토픽 입력 (예: business, daily)"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTopic();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addTopic}>
              추가
            </Button>
          </div>
          {form.topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.topics.map((topic) => (
                <Badge key={topic} color="purple">
                  {topic}
                  <button
                    type="button"
                    onClick={() => removeTopic(topic)}
                    className="ml-1 hover:text-purple-900"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Generate Content Checkbox */}
        {!editWord && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <Checkbox
              label="AI로 콘텐츠 자동 생성"
              checked={form.generateContent}
              onChange={(e) =>
                setForm({ ...form, generateContent: e.target.checked })
              }
            />
            <p className="text-sm text-slate-500 mt-1 ml-6">
              어원, 연상법, 예문 등을 Claude AI가 자동으로 생성합니다.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!form.word || form.examCategories.length === 0}
          >
            {editWord ? '수정하기' : '추가하기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ---------------------------------------------
// Batch Upload Modal
// ---------------------------------------------
interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { batchCreate, loading, error } = useWordMutations();

  const [form, setForm] = useState<BatchCreateForm>({
    words: '',
    examCategory: 'SUNEUNG',
    level: 'B1',
    generateContent: false,
  });

  const [result, setResult] = useState<{
    created: number;
    failed: string[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await batchCreate(form);
      setResult(res);
      if (res && res.created > 0) {
        onSuccess();
      }
    } catch {
      // Error handled by hook
    }
  };

  const wordCount = form.words
    .split('\n')
    .map((w) => w.trim())
    .filter(Boolean).length;

  const handleClose = () => {
    setResult(null);
    setForm({
      words: '',
      examCategory: 'SUNEUNG',
      level: 'B1',
      generateContent: false,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="배치 업로드" size="lg">
      {result ? (
        <div className="space-y-4">
          {/* Results */}
          <Alert type="success" title="업로드 완료">
            {result.created}개 단어가 추가되었습니다.
          </Alert>

          {result.failed.length > 0 && (
            <Alert type="error" title="실패한 단어">
              {result.failed.length}개 단어 처리 실패:{' '}
              {result.failed.slice(0, 10).join(', ')}
              {result.failed.length > 10 && ` 외 ${result.failed.length - 10}개`}
            </Alert>
          )}

          <div className="flex justify-end">
            <Button variant="primary" onClick={handleClose}>
              확인
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert type="error" title="오류">
              {error}
            </Alert>
          )}

          {/* Words Textarea */}
          <div>
            <Textarea
              label={`단어 목록 (${wordCount}개)`}
              placeholder="한 줄에 하나의 단어를 입력하세요&#10;abandon&#10;abundant&#10;accelerate"
              value={form.words}
              onChange={(e) => setForm({ ...form, words: e.target.value })}
              rows={10}
              helperText="최대 500개까지 한 번에 업로드할 수 있습니다."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Exam Category */}
            <Select
              label="시험 카테고리"
              value={form.examCategory}
              onChange={(e) =>
                setForm({ ...form, examCategory: e.target.value as ExamCategory })
              }
              options={Object.entries(EXAM_CATEGORY_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />

            {/* Level */}
            <Select
              label="난이도"
              value={form.level}
              onChange={(e) =>
                setForm({ ...form, level: e.target.value as DifficultyLevel })
              }
              options={Object.entries(LEVEL_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>

          {/* Generate Content */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <Checkbox
              label="AI로 콘텐츠 자동 생성 (배치)"
              checked={form.generateContent}
              onChange={(e) =>
                setForm({ ...form, generateContent: e.target.checked })
              }
            />
            <p className="text-sm text-slate-500 mt-1 ml-6">
              ⚠️ 대량 생성 시 시간이 오래 걸릴 수 있습니다. 백그라운드에서 처리됩니다.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={wordCount === 0 || wordCount > 500}
            >
              {wordCount}개 업로드
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

// ---------------------------------------------
// AI Generation Modal
// ---------------------------------------------
interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: VocaWord | null;
  onSuccess: () => void;
}

export const AIGenerationModal: React.FC<AIGenerationModalProps> = ({
  isOpen,
  onClose,
  word,
  onSuccess,
}) => {
  const { generating, progress, error, generateContent } = useContentGeneration();
  const [regenerate, setRegenerate] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCompleted(false);
      setRegenerate(false);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!word) return;
    try {
      await generateContent(word.id, regenerate);
      setCompleted(true);
      onSuccess();
    } catch {
      // Error handled by hook
    }
  };

  if (!word) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI 콘텐츠 생성"
      size="md"
    >
      <div className="space-y-6">
        {/* Word Info */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {word.word[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{word.word}</h3>
            <div className="flex gap-2 mt-1">
              {word.examCategories?.[0] && (
                <Badge color="pink">{EXAM_CATEGORY_LABELS[word.examCategories[0]]}</Badge>
              )}
              <Badge color="blue">
                {word.level}
              </Badge>
            </div>
          </div>
        </div>

        {completed ? (
          <>
            <Alert type="success" title="생성 완료!">
              AI 콘텐츠가 성공적으로 생성되었습니다.
            </Alert>
            <div className="flex justify-end">
              <Button variant="primary" onClick={onClose}>
                확인
              </Button>
            </div>
          </>
        ) : generating ? (
          <div className="space-y-4 py-8">
            <div className="flex justify-center">
              <div className="relative">
                <Spinner size="lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-pink-600">AI</span>
                </div>
              </div>
            </div>
            <p className="text-center text-slate-600">
              Claude AI가 콘텐츠를 생성하고 있습니다...
            </p>
            <ProgressBar progress={progress?.progress || 0} color="pink" />
            <p className="text-center text-sm text-slate-400">
              어원, 연상법, 예문 등을 분석 중
            </p>
          </div>
        ) : (
          <>
            {error && (
              <Alert type="error" title="생성 실패">
                {error}
              </Alert>
            )}

            {/* What will be generated */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">
                생성될 콘텐츠
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '🔊', label: '발음 (IPA)' },
                  { icon: '📚', label: '어원' },
                  { icon: '🧩', label: '형태 분석' },
                  { icon: '🔗', label: '콜로케이션' },
                  { icon: '🎵', label: '라이밍' },
                  { icon: '💡', label: '연상 기억법' },
                  { icon: '✍️', label: '예문' },
                  { icon: '🔄', label: '동의어/반의어' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm text-slate-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {word.content && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <Checkbox
                  label="기존 콘텐츠 덮어쓰기"
                  checked={regenerate}
                  onChange={(e) => setRegenerate(e.target.checked)}
                />
                <p className="text-xs text-amber-600 ml-6 mt-1">
                  이 단어에는 이미 AI 생성 콘텐츠가 있습니다.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button variant="primary" onClick={handleGenerate}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                AI 생성 시작
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

// ---------------------------------------------
// Review Modal
// ---------------------------------------------
interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: VocaWord | null;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  word,
  onSuccess,
}) => {
  const { reviewWord, publishWord, loading, error } = useReview();

  const [form, setForm] = useState<ReviewForm>({
    action: 'approve',
    notes: '',
  });

  const handleReview = async () => {
    if (!word) return;
    try {
      await reviewWord(word.id, form);
      onSuccess();
      onClose();
    } catch {
      // Error handled
    }
  };

  const handlePublish = async () => {
    if (!word) return;
    try {
      await publishWord(word.id);
      onSuccess();
      onClose();
    } catch {
      // Error handled
    }
  };

  if (!word) return null;

  const canPublish = word.status === 'APPROVED';
  const canReview = word.status === 'PENDING_REVIEW' || word.status === 'DRAFT';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="콘텐츠 검토" size="md">
      <div className="space-y-6">
        {error && (
          <Alert type="error" title="오류">
            {error}
          </Alert>
        )}

        {/* Word Info */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-slate-900">{word.word}</span>
            <Badge
              color={
                word.status === 'PUBLISHED'
                  ? 'green'
                  : word.status === 'APPROVED'
                  ? 'blue'
                  : word.status === 'PENDING_REVIEW'
                  ? 'yellow'
                  : 'gray'
              }
            >
              {STATUS_LABELS[word.status]}
            </Badge>
          </div>
        </div>

        {canPublish ? (
          <>
            <Alert type="info">
              이 단어는 승인된 상태입니다. 발행하면 사용자에게 공개됩니다.
            </Alert>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button variant="primary" onClick={handlePublish} loading={loading}>
                발행하기
              </Button>
            </div>
          </>
        ) : canReview ? (
          <>
            {/* Review Action */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                검토 결과
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, action: 'approve' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    form.action === 'approve'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl mb-1">✅</div>
                  <div className="text-sm font-medium text-slate-700">승인</div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, action: 'request_changes' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    form.action === 'request_changes'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl mb-1">📝</div>
                  <div className="text-sm font-medium text-slate-700">수정 요청</div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, action: 'reject' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    form.action === 'reject'
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl mb-1">❌</div>
                  <div className="text-sm font-medium text-slate-700">반려</div>
                </button>
              </div>
            </div>

            {/* Notes */}
            <Textarea
              label="검토 메모"
              placeholder="검토 의견을 작성하세요 (선택)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button
                variant={
                  form.action === 'approve'
                    ? 'primary'
                    : form.action === 'reject'
                    ? 'danger'
                    : 'secondary'
                }
                onClick={handleReview}
                loading={loading}
              >
                {form.action === 'approve'
                  ? '승인하기'
                  : form.action === 'reject'
                  ? '반려하기'
                  : '수정 요청'}
              </Button>
            </div>
          </>
        ) : (
          <Alert type="info">
            이 단어는 이미 발행되었거나 검토할 수 없는 상태입니다.
          </Alert>
        )}
      </div>
    </Modal>
  );
};

// ---------------------------------------------
// JSON Import Modal (for Claude Max workflow)
// ---------------------------------------------
interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordId: string;
  wordName: string;
}

const JsonImportModal: React.FC<JsonImportModalProps> = ({
  isOpen,
  onClose,
  wordId,
  wordName,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    setError(null);

    try {
      const parsed = JSON.parse(jsonInput);

      // Validate structure
      if (!parsed.content) {
        throw new Error('JSON에 content 필드가 필요합니다.');
      }

      // Call API to update content
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${apiBase}/admin/words/${wordId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(adminKey ? { 'x-admin-key': adminKey } : {}),
        },
        body: JSON.stringify(parsed.content),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Import failed' }));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh to see changes
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSON 파싱 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setJsonInput('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Claude Max에서 가져오기" size="lg">
      <div className="space-y-4">
        {success ? (
          <Alert type="success" title="가져오기 완료!">
            콘텐츠가 성공적으로 업데이트되었습니다.
          </Alert>
        ) : (
          <>
            <Alert type="info">
              <strong>{wordName}</strong> 단어의 콘텐츠를 업데이트합니다.
              <br />
              Claude Max에서 편집한 JSON을 붙여넣으세요.
            </Alert>

            {error && (
              <Alert type="error" title="오류">
                {error}
              </Alert>
            )}

            <Textarea
              label="JSON 데이터"
              placeholder='{"word": "example", "content": {...}}'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                loading={loading}
                disabled={!jsonInput.trim()}
              >
                가져오기
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

// ---------------------------------------------
// Word Detail View
// ---------------------------------------------
interface WordDetailViewProps {
  word: VocaWord & { content?: VocaContentFull };
  onClose: () => void;
  onEdit: () => void;
  onGenerate: () => void;
  onReview: () => void;
}

export const WordDetailView: React.FC<WordDetailViewProps> = ({
  word,
  onClose,
  onEdit,
  onGenerate,
  onReview,
}) => {
  const content = word.content;
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Export word data as JSON for Claude Max editing with guide template
  const handleExportJson = async () => {
    const contentData = content ? {
      ipaUs: content.ipaUs,
      ipaUk: content.ipaUk,
      pronunciation: content.pronunciation,
      etymology: content.etymology,
      etymologyLang: content.etymologyLang,
      prefix: content.prefix,
      root: content.root,
      suffix: content.suffix,
      morphologyNote: content.morphologyNote,
      mnemonic: content.mnemonic,
      mnemonicKorean: content.mnemonicKorean,
      rhymingWords: content.rhymingWords,
      rhymingNote: content.rhymingNote,
      synonyms: content.synonyms,
      antonyms: content.antonyms,
      definitions: content.definitions?.map(d => ({
        partOfSpeech: d.partOfSpeech,
        definitionEn: d.definitionEn,
        definitionKo: d.definitionKo,
        exampleEn: d.exampleEn,
        exampleKo: d.exampleKo,
      })),
      collocations: content.collocations?.map(c => ({
        phrase: c.phrase,
        translation: c.translation,
      })),
      funnyExamples: content.funnyExamples?.map(e => ({
        sentenceEn: e.sentenceEn,
        sentenceKo: e.sentenceKo,
        isFunny: e.isFunny,
      })),
    } : null;

    // Claude Max editing guide template
    const guideTemplate = `# VocaVision 콘텐츠 편집 요청

## 단어 정보
- **단어**: ${word.word}
- **난이도**: ${word.level}
- **시험 카테고리**: ${word.examCategories.join(', ')}
${word.topics.length > 0 ? `- **토픽**: ${word.topics.join(', ')}` : ''}

## 편집 목적
AI가 생성한 콘텐츠를 고품질로 개선해주세요.

## 편집 규칙
1. **연상 기억법 (mnemonic)**: 경선식 스타일로 한국어 발음과 연결하여 재미있고 기억에 남게 작성
   - 예: "abandon" → "'어밴던'은 '아! 밴(van)에서 던져버린다!'고 기억하세요"
2. **한글 연상 (mnemonicKorean)**: 짧고 임팩트 있는 한 줄 연상 공식
   - 예: "아! 밴(van)에서 던지다 → 버리다"
3. **예문 (funnyExamples)**: 유머러스하고 기억에 남는 상황 설정, 한국 고등학생 맥락 권장
4. **어원 (etymology)**: 정확한 어원 정보와 의미 변화 설명
5. **형태 분석**: prefix, root, suffix를 정확히 분리하고 각 의미 설명

## 현재 데이터
\`\`\`json
${JSON.stringify({ word: word.word, level: word.level, examCategories: word.examCategories, topics: word.topics, content: contentData }, null, 2)}
\`\`\`

## 응답 형식
편집 완료 후 아래 JSON 형식으로만 응답해주세요 (VocaVision에 바로 가져오기 가능):
\`\`\`json
{
  "word": "${word.word}",
  "content": {
    // 개선된 콘텐츠 데이터
  }
}
\`\`\`
`;

    try {
      await navigator.clipboard.writeText(guideTemplate);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Slide Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{word.word}</h2>
              <div className="flex gap-2 mt-1">
                <Badge
                  color={
                    word.status === 'PUBLISHED'
                      ? 'green'
                      : word.status === 'APPROVED'
                      ? 'blue'
                      : word.status === 'PENDING_REVIEW'
                      ? 'yellow'
                      : 'gray'
                  }
                >
                  {STATUS_LABELS[word.status]}
                </Badge>
                <Badge color="pink">{word.level}</Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Claude Max Export/Import */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportJson}
              title="Claude Max로 내보내기 (JSON 복사)"
            >
              {copySuccess ? (
                <span className="text-emerald-600">복사됨!</span>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  JSON
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJsonImport(true)}
              title="Claude Max에서 가져오기"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              가져오기
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              수정
            </Button>
            {!content && (
              <Button variant="outline" size="sm" onClick={onGenerate}>
                AI 생성
              </Button>
            )}
            {(word.status === 'PENDING_REVIEW' || word.status === 'APPROVED') && (
              <Button variant="primary" size="sm" onClick={onReview}>
                검토
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {content ? (
            <>
              {/* Pronunciation */}
              {(content.ipaUs || content.pronunciation) && (
                <Card>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    🔊 발음
                  </h3>
                  <div className="space-y-2">
                    {content.ipaUs && (
                      <p className="text-slate-600">
                        <span className="text-slate-400">US:</span> {content.ipaUs}
                      </p>
                    )}
                    {content.ipaUk && (
                      <p className="text-slate-600">
                        <span className="text-slate-400">UK:</span> {content.ipaUk}
                      </p>
                    )}
                    {content.pronunciation && (
                      <p className="text-slate-600">
                        <span className="text-slate-400">한글:</span> {content.pronunciation}
                      </p>
                    )}
                  </div>
                </Card>
              )}

              {/* Definitions */}
              {content.definitions?.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    📖 정의
                  </h3>
                  <div className="space-y-4">
                    {content.definitions.map((def, i) => (
                      <div key={def.id || i} className="pl-4 border-l-2 border-pink-300">
                        <Badge color="gray" size="sm">{def.partOfSpeech}</Badge>
                        <p className="text-slate-900 mt-1">{def.definitionEn}</p>
                        <p className="text-slate-600 text-sm">{def.definitionKo}</p>
                        {def.exampleEn && (
                          <p className="text-slate-500 text-sm italic mt-2">
                            "{def.exampleEn}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Etymology */}
              {content.etymology && (
                <Card>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    📚 어원
                  </h3>
                  {content.etymologyLang && (
                    <Badge color="purple" size="sm">{content.etymologyLang}</Badge>
                  )}
                  <p className="text-slate-600 mt-2">{content.etymology}</p>
                </Card>
              )}

              {/* Morphology */}
              {(content.prefix || content.root || content.suffix) && (
                <Card>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    🧩 형태 분석
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {content.prefix && (
                      <div className="px-3 py-2 bg-blue-50 rounded-lg">
                        <span className="text-xs text-blue-500">접두사</span>
                        <p className="font-medium text-blue-700">{content.prefix}-</p>
                      </div>
                    )}
                    {content.root && (
                      <div className="px-3 py-2 bg-purple-50 rounded-lg">
                        <span className="text-xs text-purple-500">어근</span>
                        <p className="font-medium text-purple-700">{content.root}</p>
                      </div>
                    )}
                    {content.suffix && (
                      <div className="px-3 py-2 bg-pink-50 rounded-lg">
                        <span className="text-xs text-pink-500">접미사</span>
                        <p className="font-medium text-pink-700">-{content.suffix}</p>
                      </div>
                    )}
                  </div>
                  {content.morphologyNote && (
                    <p className="text-slate-500 text-sm mt-3">{content.morphologyNote}</p>
                  )}
                </Card>
              )}

              {/* Mnemonic */}
              {content.mnemonic && (
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    💡 연상 기억법
                  </h3>
                  <p className="text-slate-700">{content.mnemonic}</p>
                  {content.mnemonicKorean && (
                    <p className="text-amber-700 font-medium mt-2">
                      🇰🇷 {content.mnemonicKorean}
                    </p>
                  )}
                  {content.mnemonicImage && (
                    <div className="mt-4">
                      <img
                        src={content.mnemonicImage}
                        alt="Mnemonic"
                        className="rounded-lg max-h-48 object-contain"
                      />
                    </div>
                  )}
                </Card>
              )}

              {/* Collocations */}
              {content.collocations?.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    🔗 콜로케이션
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {content.collocations.map((col, i) => (
                      <div
                        key={col.id || i}
                        className="px-3 py-2 bg-slate-100 rounded-lg"
                      >
                        <p className="font-medium text-slate-700">{col.phrase}</p>
                        {col.translation && (
                          <p className="text-sm text-slate-500">{col.translation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Rhyming */}
              {content.rhymingWords?.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    🎵 라이밍
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {content.rhymingWords.map((rw, i) => (
                      <Badge key={i} color="blue">{rw}</Badge>
                    ))}
                  </div>
                  {content.rhymingNote && (
                    <p className="text-slate-500 text-sm mt-2">{content.rhymingNote}</p>
                  )}
                </Card>
              )}

              {/* Examples */}
              {content.funnyExamples?.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    ✍️ 예문
                  </h3>
                  <div className="space-y-3">
                    {content.funnyExamples.map((ex, i) => (
                      <div key={ex.id || i} className="p-3 bg-slate-50 rounded-lg">
                        {ex.isFunny && <Badge color="yellow" size="sm">재미있는 예문</Badge>}
                        <p className="text-slate-800 mt-1">{ex.sentenceEn}</p>
                        <p className="text-slate-500 text-sm">{ex.sentenceKo}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Related Words */}
              {(content.synonyms?.length > 0 || content.antonyms?.length > 0) && (
                <Card>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    🔄 관련어
                  </h3>
                  {content.synonyms?.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm text-slate-500">동의어: </span>
                      {content.synonyms.map((s, i) => (
                        <Badge key={i} color="green" size="sm" className="ml-1">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {content.antonyms?.length > 0 && (
                    <div>
                      <span className="text-sm text-slate-500">반의어: </span>
                      {content.antonyms.map((a, i) => (
                        <Badge key={i} color="red" size="sm" className="ml-1">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Claude Max Editing Section */}
              <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                  Claude Max로 편집하기
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0 font-medium">1</span>
                    <span>아래 버튼으로 JSON 복사 후 Claude Max에 붙여넣기</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0 font-medium">2</span>
                    <span>&quot;이 구조 유지한 채로 내용만 개선해줘&quot; 요청</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0 font-medium">3</span>
                    <span>수정된 JSON을 &apos;가져오기&apos; 버튼으로 적용</span>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-violet-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportJson}
                      className="border-violet-300 text-violet-700 hover:bg-violet-100"
                    >
                      {copySuccess ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          복사됨!
                        </span>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          JSON 내보내기
                        </>
                      )}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowJsonImport(true)}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      JSON 가져오기
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                아직 콘텐츠가 없습니다
              </h3>
              <p className="text-slate-500 mb-4">
                AI를 사용하여 콘텐츠를 자동으로 생성해보세요.
              </p>
              <Button variant="primary" onClick={onGenerate}>
                AI 콘텐츠 생성
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* JSON Import Modal */}
      <JsonImportModal
        isOpen={showJsonImport}
        onClose={() => setShowJsonImport(false)}
        wordId={word.id}
        wordName={word.word}
      />
    </div>
  );
};
