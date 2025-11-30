/**
 * VocaVision Admin Word Forms
 * 단어 폼 & 모달 컴포넌트
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Input,
  Select,
  Textarea,
  Checkbox,
  ProgressBar,
  Alert,
  Badge,
  Card,
} from './ui';
import { useWordMutations, useContentGeneration, useReview, useWordDetail } from '@/hooks/useAdminApi';
import {
  AdminWord,
  WordDetail,
  WordFormData,
  BatchUploadData,
  EXAM_CATEGORIES,
  CEFR_LEVELS,
  CONTENT_STATUS_LABELS,
  LEVEL_COLORS,
  STATUS_COLORS,
  CEFRLevel,
  ExamCategory,
} from '@/types/admin.types';

// ============================================
// Word Form Modal
// ============================================

interface WordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editWord?: AdminWord | null;
  onSuccess: () => void;
}

export function WordFormModal({ isOpen, onClose, editWord, onSuccess }: WordFormModalProps) {
  const { createWord, updateWord, loading, error } = useWordMutations();
  const [formData, setFormData] = useState<WordFormData>({
    word: '',
    definition: '',
    definitionKo: '',
    pronunciation: '',
    partOfSpeech: 'NOUN',
    examCategories: ['SUNEUNG'] as ExamCategory[],
    level: 'B1' as CEFRLevel,
    topics: [],
    generateContent: true,
  });

  useEffect(() => {
    if (editWord) {
      setFormData({
        word: editWord.word,
        definition: editWord.definition,
        definitionKo: editWord.definitionKo || '',
        pronunciation: editWord.pronunciation || '',
        partOfSpeech: editWord.partOfSpeech,
        examCategories: editWord.examCategories,
        level: editWord.level,
        topics: editWord.topics,
        generateContent: false,
      });
    } else {
      setFormData({
        word: '',
        definition: '',
        definitionKo: '',
        pronunciation: '',
        partOfSpeech: 'NOUN',
        examCategories: ['SUNEUNG'],
        level: 'B1',
        topics: [],
        generateContent: true,
      });
    }
  }, [editWord, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let result;
    if (editWord) {
      result = await updateWord(editWord.id, formData);
    } else {
      result = await createWord(formData);
    }

    if (result) {
      onSuccess();
      onClose();
    }
  };

  const handleExamToggle = (exam: ExamCategory) => {
    const current = formData.examCategories;
    const updated = current.includes(exam)
      ? current.filter((e) => e !== exam)
      : [...current, exam];
    setFormData({ ...formData, examCategories: updated });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editWord ? '단어 수정' : '새 단어 추가'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert type="error" onClose={() => {}}>
            {error}
          </Alert>
        )}

        <Input
          label="단어 *"
          value={formData.word}
          onChange={(e) => setFormData({ ...formData, word: e.target.value })}
          placeholder="영어 단어 입력"
          required
          disabled={!!editWord}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="품사"
            value={formData.partOfSpeech || 'NOUN'}
            onChange={(e) => setFormData({ ...formData, partOfSpeech: e.target.value })}
            options={[
              { value: 'NOUN', label: '명사' },
              { value: 'VERB', label: '동사' },
              { value: 'ADJECTIVE', label: '형용사' },
              { value: 'ADVERB', label: '부사' },
              { value: 'PREPOSITION', label: '전치사' },
              { value: 'CONJUNCTION', label: '접속사' },
            ]}
          />

          <Select
            label="난이도 *"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value as CEFRLevel })}
            options={CEFR_LEVELS.map((l) => ({ value: l, label: l }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">시험 카테고리 *</label>
          <div className="flex flex-wrap gap-2">
            {EXAM_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => handleExamToggle(cat.value)}
                className={`
                  px-3 py-1 text-sm rounded-full border transition-colors
                  ${
                    formData.examCategories.includes(cat.value)
                      ? 'bg-voca-pink-100 text-voca-pink-700 border-voca-pink-300'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="발음"
          value={formData.pronunciation || ''}
          onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
          placeholder="[əˈbændən]"
        />

        <Textarea
          label="영어 정의"
          value={formData.definition || ''}
          onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
          placeholder="English definition..."
          rows={2}
        />

        <Textarea
          label="한국어 정의"
          value={formData.definitionKo || ''}
          onChange={(e) => setFormData({ ...formData, definitionKo: e.target.value })}
          placeholder="한국어 뜻..."
          rows={2}
        />

        {!editWord && (
          <Checkbox
            label="AI로 콘텐츠 자동 생성 (어원, 연상법, 예문 등)"
            checked={formData.generateContent || false}
            onChange={(e) => setFormData({ ...formData, generateContent: e.target.checked })}
          />
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" loading={loading}>
            {editWord ? '수정' : '추가'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================
// Batch Upload Modal
// ============================================

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BatchUploadModal({ isOpen, onClose, onSuccess }: BatchUploadModalProps) {
  const { batchCreate, loading, error } = useWordMutations();
  const [formData, setFormData] = useState<BatchUploadData>({
    words: '',
    examCategory: 'SUNEUNG',
    level: 'B1',
    generateContent: false,
  });
  const [result, setResult] = useState<{ created: number; failed: string[] } | null>(null);

  const wordCount = formData.words
    .split('\n')
    .filter((w) => w.trim().length > 0).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await batchCreate(formData);
    if (result) {
      setResult(result);
      if (result.failed.length === 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    }
  };

  const handleClose = () => {
    setResult(null);
    setFormData({
      words: '',
      examCategory: 'SUNEUNG',
      level: 'B1',
      generateContent: false,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="배치 업로드" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert type="error" onClose={() => {}}>
            {error}
          </Alert>
        )}

        {result && (
          <Alert type={result.failed.length > 0 ? 'warning' : 'success'}>
            {result.created}개 단어 생성 완료
            {result.failed.length > 0 && (
              <span className="block mt-1 text-sm">
                실패: {result.failed.join(', ')}
              </span>
            )}
          </Alert>
        )}

        <Textarea
          label={`단어 목록 (줄바꿈으로 구분, ${wordCount}/500)`}
          value={formData.words}
          onChange={(e) => setFormData({ ...formData, words: e.target.value })}
          placeholder="abandon&#10;abundant&#10;accelerate&#10;accommodate"
          rows={10}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="시험 카테고리"
            value={formData.examCategory}
            onChange={(e) =>
              setFormData({ ...formData, examCategory: e.target.value as ExamCategory })
            }
            options={EXAM_CATEGORIES}
          />

          <Select
            label="난이도"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value as CEFRLevel })}
            options={CEFR_LEVELS.map((l) => ({ value: l, label: l }))}
          />
        </div>

        <Checkbox
          label="AI로 콘텐츠 자동 생성 (시간이 오래 걸릴 수 있음)"
          checked={formData.generateContent}
          onChange={(e) => setFormData({ ...formData, generateContent: e.target.checked })}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={wordCount === 0 || wordCount > 500}
          >
            {wordCount}개 단어 업로드
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================
// AI Generation Modal
// ============================================

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: AdminWord | null;
  onSuccess: () => void;
}

export function AIGenerationModal({ isOpen, onClose, word, onSuccess }: AIGenerationModalProps) {
  const { generating, progress, error, generateContent } = useContentGeneration();

  useEffect(() => {
    if (isOpen && word) {
      generateContent(word.id).then((success) => {
        if (success) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      });
    }
  }, [isOpen, word]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI 콘텐츠 생성" size="md">
      <div className="text-center py-8">
        {word && (
          <p className="text-2xl font-bold text-gray-900 mb-4">{word.word}</p>
        )}

        {error ? (
          <Alert type="error" className="text-left">
            {error}
          </Alert>
        ) : (
          <>
            <div className="mb-4">
              <ProgressBar
                progress={progress?.progress || 0}
                color="pink"
                showLabel
              />
            </div>

            <p className="text-sm text-gray-500">
              {progress?.status === 'generating'
                ? 'Claude AI가 콘텐츠를 생성하고 있습니다...'
                : progress?.status === 'completed'
                ? '생성 완료!'
                : '준비 중...'}
            </p>
          </>
        )}

        <div className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={generating}>
            {progress?.status === 'completed' ? '닫기' : '취소'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// Review Modal
// ============================================

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: AdminWord | null;
  onSuccess: () => void;
}

export function ReviewModal({ isOpen, onClose, word, onSuccess }: ReviewModalProps) {
  const { reviewWord, publishWord, loading, error } = useReview();
  const [notes, setNotes] = useState('');

  const handleAction = async (action: 'approve' | 'reject' | 'request_changes') => {
    if (!word) return;

    const success = await reviewWord(word.id, { action, notes });
    if (success) {
      onSuccess();
      onClose();
    }
  };

  const handlePublish = async () => {
    if (!word) return;

    const success = await publishWord(word.id);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="콘텐츠 검토" size="md">
      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {word && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">{word.word}</span>
            <Badge className={STATUS_COLORS[word.contentStatus]}>
              {CONTENT_STATUS_LABELS[word.contentStatus]}
            </Badge>
          </div>

          <Textarea
            label="검토 메모"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="검토 사유나 수정 요청 사항을 입력하세요..."
            rows={3}
          />

          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {word.contentStatus === 'APPROVED' ? (
              <Button onClick={handlePublish} loading={loading}>
                발행하기
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  onClick={() => handleAction('approve')}
                  loading={loading}
                >
                  승인
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction('request_changes')}
                  loading={loading}
                >
                  수정 요청
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleAction('reject')}
                  loading={loading}
                >
                  거절
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={onClose} className="ml-auto">
              취소
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ============================================
// Word Detail View (Slide Panel)
// ============================================

interface WordDetailViewProps {
  word: AdminWord | null;
  onClose: () => void;
  onEdit: () => void;
  onGenerate: () => void;
  onReview: () => void;
}

export function WordDetailView({
  word,
  onClose,
  onEdit,
  onGenerate,
  onReview,
}: WordDetailViewProps) {
  const { word: wordDetail, loading, fetchWord, clearWord } = useWordDetail();

  useEffect(() => {
    if (word) {
      fetchWord(word.id);
    } else {
      clearWord();
    }
  }, [word, fetchWord, clearWord]);

  if (!word) return null;

  const detail = wordDetail as WordDetail | null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-modal z-50 animate-slide-in-right overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{word.word}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={LEVEL_COLORS[word.level]}>{word.level}</Badge>
            <Badge className={STATUS_COLORS[word.contentStatus]}>
              {CONTENT_STATUS_LABELS[word.contentStatus]}
            </Badge>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-b flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          수정
        </Button>
        <Button size="sm" variant="outline" onClick={onGenerate}>
          AI 생성
        </Button>
        <Button size="sm" onClick={onReview}>
          검토
        </Button>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-voca-pink-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <>
            {/* Pronunciation */}
            {(word.pronunciation || detail?.ipaUs) && (
              <Section title="발음">
                <p className="text-gray-600">
                  {detail?.ipaUs && <span className="mr-4">US: {detail.ipaUs}</span>}
                  {detail?.ipaUk && <span>UK: {detail.ipaUk}</span>}
                </p>
                {word.pronunciation && (
                  <p className="text-sm text-gray-500 mt-1">{word.pronunciation}</p>
                )}
              </Section>
            )}

            {/* Definition */}
            <Section title="정의">
              <p className="text-gray-900">{word.definition}</p>
              {word.definitionKo && (
                <p className="text-gray-600 mt-2">{word.definitionKo}</p>
              )}
            </Section>

            {/* Etymology */}
            {detail?.etymology && (
              <Section title="어원">
                <p className="text-gray-600">{detail.etymology.origin}</p>
                {detail.etymology.breakdown && (
                  <p className="text-sm text-gray-500 mt-2">
                    {detail.etymology.breakdown}
                  </p>
                )}
              </Section>
            )}

            {/* Mnemonics */}
            {detail?.mnemonics && detail.mnemonics.length > 0 && (
              <Section title="연상 기억법">
                {detail.mnemonics.map((m, i) => (
                  <Card key={i} padding="sm" className="mb-2">
                    <p className="font-medium text-gray-900">{m.title}</p>
                    <p className="text-gray-600 text-sm">{m.content}</p>
                    {m.koreanHint && (
                      <p className="text-voca-pink-500 text-sm mt-1">
                        "{m.koreanHint}"
                      </p>
                    )}
                    {m.gifUrl && (
                      <img
                        src={m.gifUrl}
                        alt="mnemonic"
                        className="mt-2 rounded-lg w-full"
                      />
                    )}
                  </Card>
                ))}
              </Section>
            )}

            {/* Collocations */}
            {detail?.collocations && detail.collocations.length > 0 && (
              <Section title="콜로케이션">
                <div className="space-y-2">
                  {detail.collocations.map((c, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="font-medium">{c.phrase}</span>
                      <span className="text-gray-500">{c.translation}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Examples */}
            {detail?.examples && detail.examples.length > 0 && (
              <Section title="예문">
                {detail.examples.map((ex, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-gray-900">{ex.sentence}</p>
                    {ex.translation && (
                      <p className="text-gray-500 text-sm">{ex.translation}</p>
                    )}
                    {ex.isFunny && (
                      <Badge color="yellow" size="sm" className="mt-1">
                        재미있는 예문
                      </Badge>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {/* Related Words */}
            {(detail?.synonyms?.length || detail?.antonyms?.length) && (
              <Section title="관련 단어">
                {detail?.synonyms && detail.synonyms.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-500 mr-2">유의어:</span>
                    {detail.synonyms.map((s, i) => (
                      <Badge key={i} color="blue" size="sm" className="mr-1">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
                {detail?.antonyms && detail.antonyms.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 mr-2">반의어:</span>
                    {detail.antonyms.map((a, i) => (
                      <Badge key={i} color="red" size="sm" className="mr-1">
                        {a}
                      </Badge>
                    ))}
                  </div>
                )}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}
