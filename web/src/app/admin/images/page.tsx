'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  Button,
  Card,
  Badge,
  Alert,
  Spinner,
  Select,
  Input,
  Modal,
  Checkbox,
} from '@/components/admin/ui';

// Types
interface WordWithMissingImages {
  id: string;
  word: string;
  definitionKo?: string;
  examLevels: Array<{ examCategory: string; level: string }>;
  visuals: Array<{
    type: 'CONCEPT' | 'MNEMONIC' | 'RHYME';
    imageUrl?: string | null;
    captionKo?: string;
    captionEn?: string;
  }>;
  missingTypes: ('CONCEPT' | 'MNEMONIC' | 'RHYME')[];
}

interface MissingImagesResponse {
  success: boolean;
  data: {
    words: WordWithMissingImages[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    filters: {
      examCategory?: string;
      imageType?: string;
      search?: string;
    };
  };
}

interface RegenerateResponse {
  success: boolean;
  data?: {
    visual: {
      type: string;
      imageUrl: string;
      captionKo?: string;
      captionEn?: string;
    };
  };
  error?: string;
}

type ImageType = 'CONCEPT' | 'MNEMONIC' | 'RHYME';

const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  CONCEPT: '개념',
  MNEMONIC: '연상',
  RHYME: '라임',
};

const IMAGE_TYPE_COLORS: Record<ImageType, 'blue' | 'yellow' | 'purple'> = {
  CONCEPT: 'blue',
  MNEMONIC: 'yellow',
  RHYME: 'purple',
};

export default function AdminImagesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  // State
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<WordWithMissingImages[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [examCategory, setExamCategory] = useState('');
  const [imageType, setImageType] = useState('');
  const [search, setSearch] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Selection for batch operations
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Modal state
  const [selectedWord, setSelectedWord] = useState<WordWithMissingImages | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [regenerating, setRegenerating] = useState<ImageType | null>(null);
  const [uploadingType, setUploadingType] = useState<ImageType | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Batch regeneration state
  const [batchRegenerating, setBatchRegenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Auth check
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, hasHydrated, router]);

  // Load data on mount and filter change
  useEffect(() => {
    if (user) {
      loadWords();
    }
  }, [user, pagination.page, examCategory, imageType]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      if (pagination.page === 1) {
        loadWords();
      } else {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  const loadWords = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      if (examCategory) params.set('examCategory', examCategory);
      if (imageType) params.set('imageType', imageType);
      if (search) params.set('search', search);

      const response = await api.get<MissingImagesResponse>(
        `/admin/words/missing-images?${params.toString()}`
      );

      if (response.data.success) {
        setWords(response.data.data.words);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load words:', err);
      setError(err instanceof Error ? err.message : 'Failed to load words');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWord = (wordId: string) => {
    setSelectedWords((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedWords(new Set());
    } else {
      setSelectedWords(new Set(words.map((w) => w.id)));
    }
    setSelectAll(!selectAll);
  };

  const openWordModal = (word: WordWithMissingImages) => {
    setSelectedWord(word);
    setModalOpen(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedWord(null);
    setActionError(null);
    setActionSuccess(null);
  };

  const regenerateImage = async (wordId: string, type: ImageType) => {
    setRegenerating(type);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await api.post<RegenerateResponse>(
        `/admin/words/${wordId}/regenerate-image`,
        { imageType: type }
      );

      if (response.data.success && response.data.data) {
        setActionSuccess(`${IMAGE_TYPE_LABELS[type]} 이미지 생성 완료!`);
        // Update the word in the list
        if (selectedWord) {
          const updatedVisuals = [...selectedWord.visuals];
          const existingIdx = updatedVisuals.findIndex((v) => v.type === type);
          if (existingIdx >= 0) {
            updatedVisuals[existingIdx] = response.data.data.visual as any;
          } else {
            updatedVisuals.push(response.data.data.visual as any);
          }
          setSelectedWord({
            ...selectedWord,
            visuals: updatedVisuals,
            missingTypes: selectedWord.missingTypes.filter((t) => t !== type),
          });
        }
        // Refresh the list
        loadWords();
      } else {
        throw new Error(response.data.error || '이미지 생성 실패');
      }
    } catch (err) {
      console.error('Failed to regenerate image:', err);
      setActionError(err instanceof Error ? err.message : '이미지 생성 실패');
    } finally {
      setRegenerating(null);
    }
  };

  const handleImageUpload = async (wordId: string, type: ImageType, file: File) => {
    setUploadingType(type);
    setActionError(null);
    setActionSuccess(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/xxx;base64, prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const imageBase64 = await base64Promise;

      const response = await api.post<RegenerateResponse>(
        `/admin/words/${wordId}/upload-image`,
        {
          imageType: type,
          imageBase64,
        }
      );

      if (response.data.success) {
        setActionSuccess(`${IMAGE_TYPE_LABELS[type]} 이미지 업로드 완료!`);

        // Update modal state with new image
        if (selectedWord && response.data.data?.visual) {
          const updatedVisuals = [...selectedWord.visuals];
          const existingIdx = updatedVisuals.findIndex((v) => v.type === type);
          if (existingIdx >= 0) {
            updatedVisuals[existingIdx] = response.data.data.visual as any;
          } else {
            updatedVisuals.push(response.data.data.visual as any);
          }
          setSelectedWord({
            ...selectedWord,
            visuals: updatedVisuals,
            missingTypes: selectedWord.missingTypes.filter((t) => t !== type),
          });
        }

        loadWords();
      } else {
        throw new Error(response.data.error || '업로드 실패');
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      setActionError(err instanceof Error ? err.message : '업로드 실패');
    } finally {
      setUploadingType(null);
    }
  };

  const deleteImage = async (wordId: string, type: ImageType) => {
    if (!confirm(`${IMAGE_TYPE_LABELS[type]} 이미지를 삭제하시겠습니까?`)) return;

    setActionError(null);
    setActionSuccess(null);

    try {
      await api.delete(`/admin/words/${wordId}/images/${type}`);
      setActionSuccess(`${IMAGE_TYPE_LABELS[type]} 이미지 삭제 완료!`);
      loadWords();

      // Update modal state
      if (selectedWord) {
        setSelectedWord({
          ...selectedWord,
          visuals: selectedWord.visuals.filter((v) => v.type !== type),
          missingTypes: [...selectedWord.missingTypes, type],
        });
      }
    } catch (err) {
      console.error('Failed to delete image:', err);
      setActionError(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  const batchRegenerate = async () => {
    if (selectedWords.size === 0) {
      setError('선택된 단어가 없습니다.');
      return;
    }

    setBatchRegenerating(true);
    setBatchProgress({ current: 0, total: selectedWords.size });
    setError(null);

    try {
      const wordIds = Array.from(selectedWords);
      const imageTypes: ImageType[] = imageType
        ? [imageType as ImageType]
        : ['CONCEPT', 'MNEMONIC', 'RHYME'];

      const response = await api.post('/admin/words/batch-regenerate-images', {
        wordIds,
        imageTypes,
      });

      if (response.data.success) {
        setSelectedWords(new Set());
        setSelectAll(false);
        loadWords();
      }
    } catch (err) {
      console.error('Failed to batch regenerate:', err);
      setError(err instanceof Error ? err.message : '배치 생성 실패');
    } finally {
      setBatchRegenerating(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  // Loading state
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-slate-900">
                이미지 관리
              </h1>
              <Badge color="gray">{pagination.total}개 누락</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadWords}>
                새로고침
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={batchRegenerate}
                disabled={selectedWords.size === 0 || batchRegenerating}
                loading={batchRegenerating}
              >
                선택 생성 ({selectedWords.size})
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Error */}
        {error && (
          <Alert type="error" title="오류 발생" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔍</span>
            <h2 className="text-lg font-semibold text-slate-900">필터</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="시험 유형"
              value={examCategory}
              onChange={(e) => {
                setExamCategory(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={[
                { value: '', label: '전체' },
                { value: 'CSAT', label: '수능 (CSAT)' },
                { value: 'CSAT_BASIC', label: '수능 기초' },
                { value: 'TEPS', label: 'TEPS' },
                { value: 'TOEFL', label: 'TOEFL' },
                { value: 'EBS', label: 'EBS' },
              ]}
            />
            <Select
              label="이미지 유형"
              value={imageType}
              onChange={(e) => {
                setImageType(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={[
                { value: '', label: '전체' },
                { value: 'CONCEPT', label: '개념 이미지' },
                { value: 'MNEMONIC', label: '연상 이미지' },
                { value: 'RHYME', label: '라임 이미지' },
              ]}
            />
            <Input
              label="검색"
              placeholder="단어 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex items-end">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setExamCategory('');
                  setImageType('');
                  setSearch('');
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                필터 초기화
              </Button>
            </div>
          </div>
        </Card>

        {/* Words Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      label=""
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    단어
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    뜻
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    시험
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    이미지 상태
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Spinner size="md" />
                    </td>
                  </tr>
                ) : words.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      이미지가 누락된 단어가 없습니다.
                    </td>
                  </tr>
                ) : (
                  words.map((word) => (
                    <tr key={word.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          label=""
                          checked={selectedWords.has(word.id)}
                          onChange={() => handleSelectWord(word.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{word.word}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                        {word.definitionKo || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {word.examLevels.slice(0, 2).map((el, idx) => (
                            <Badge key={idx} color="gray" size="sm">
                              {el.examCategory} {el.level}
                            </Badge>
                          ))}
                          {word.examLevels.length > 2 && (
                            <Badge color="gray" size="sm">
                              +{word.examLevels.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {(['CONCEPT', 'MNEMONIC', 'RHYME'] as ImageType[]).map((type) => {
                            const hasImage = word.visuals.some(
                              (v) => v.type === type && v.imageUrl
                            );
                            return (
                              <Badge
                                key={type}
                                color={hasImage ? 'green' : 'red'}
                                size="sm"
                              >
                                {IMAGE_TYPE_LABELS[type]}
                              </Badge>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openWordModal(word)}
                        >
                          관리
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  이전
                </Button>
                <span className="px-3 py-1.5 text-sm text-slate-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Instructions */}
        <Card className="bg-slate-50 border-slate-300">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-900 mb-2">사용 안내</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>단어를 클릭하면 이미지를 개별 관리할 수 있습니다.</li>
                <li>체크박스로 여러 단어를 선택 후 일괄 생성할 수 있습니다.</li>
                <li>이미지 생성에는 단어당 약 10-30초가 소요됩니다.</li>
                <li>직접 이미지를 업로드하려면 관리 버튼을 클릭하세요.</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>

      {/* Word Image Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={selectedWord ? `"${selectedWord.word}" 이미지 관리` : '이미지 관리'}
        size="xl"
      >
        {selectedWord && (
          <div className="space-y-6">
            {/* Word Info */}
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-lg font-bold text-slate-900">{selectedWord.word}</p>
              <p className="text-slate-600">{selectedWord.definitionKo}</p>
              <div className="flex gap-1 mt-2">
                {selectedWord.examLevels.map((el, idx) => (
                  <Badge key={idx} color="gray" size="sm">
                    {el.examCategory} {el.level}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Messages */}
            {actionError && (
              <Alert type="error" onClose={() => setActionError(null)}>
                {actionError}
              </Alert>
            )}
            {actionSuccess && (
              <Alert type="success" onClose={() => setActionSuccess(null)}>
                {actionSuccess}
              </Alert>
            )}

            {/* Image Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['CONCEPT', 'MNEMONIC', 'RHYME'] as ImageType[]).map((type) => {
                const visual = selectedWord.visuals.find((v) => v.type === type);
                const hasImage = visual?.imageUrl;

                return (
                  <div
                    key={type}
                    className="border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <div className={`px-4 py-2 flex items-center justify-between ${
                      hasImage ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      <Badge color={IMAGE_TYPE_COLORS[type]}>
                        {IMAGE_TYPE_LABELS[type]}
                      </Badge>
                      <Badge color={hasImage ? 'green' : 'red'} size="sm">
                        {hasImage ? '완료' : '누락'}
                      </Badge>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Image Preview */}
                      <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {hasImage ? (
                          <Image
                            src={visual.imageUrl!}
                            alt={`${selectedWord.word} ${type}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-slate-400 text-center">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">이미지 없음</p>
                          </div>
                        )}
                      </div>

                      {/* Caption */}
                      {visual?.captionKo && (
                        <p className="text-sm text-slate-600 text-center">
                          {visual.captionKo}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant={hasImage ? 'outline' : 'primary'}
                          size="sm"
                          className="flex-1"
                          onClick={() => regenerateImage(selectedWord.id, type)}
                          loading={regenerating === type}
                          disabled={regenerating !== null || uploadingType !== null}
                        >
                          {hasImage ? '재생성' : '생성'}
                        </Button>

                        {/* File Upload */}
                        <label className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(selectedWord.id, type, file);
                              }
                              e.target.value = '';
                            }}
                            disabled={regenerating !== null || uploadingType !== null}
                          />
                          <span
                            className={`
                              inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200
                              px-3 py-1.5 text-sm w-full cursor-pointer
                              border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50
                              ${(regenerating !== null || uploadingType !== null) ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            {uploadingType === type ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : '업로드'}
                          </span>
                        </label>

                        {hasImage && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => deleteImage(selectedWord.id, type)}
                            disabled={regenerating !== null || uploadingType !== null}
                          >
                            삭제
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
