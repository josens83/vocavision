/**
 * VocaVision Admin - Vocabulary Sets (단어장) Management
 * 단어장 컬렉션 관리 컴포넌트
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  useCollections,
  useCollectionDetail,
  useCollectionMutations,
  Collection,
  CreateCollectionForm,
} from './hooks/useAdminApi';
import { Button, Badge, Input, Select, Modal, Spinner, Alert, Textarea } from './ui';

// ---------------------------------------------
// Constants
// ---------------------------------------------
const DIFFICULTY_OPTIONS = [
  { value: 'BASIC', label: '기초' },
  { value: 'INTERMEDIATE', label: '중급' },
  { value: 'ADVANCED', label: '고급' },
];

const CATEGORY_OPTIONS = [
  { value: 'CSAT', label: '수능' },
  { value: 'TEPS', label: 'TEPS' },
  { value: 'TOEIC', label: 'TOEIC' },
  { value: 'TOEFL', label: 'TOEFL' },
  { value: 'SAT', label: 'SAT' },
  { value: 'GENERAL', label: '일반' },
  { value: 'THEME', label: '테마별' },
];

const DIFFICULTY_COLORS: Record<string, 'green' | 'yellow' | 'red'> = {
  BASIC: 'green',
  INTERMEDIATE: 'yellow',
  ADVANCED: 'red',
};

// ---------------------------------------------
// Collection Card Component
// ---------------------------------------------
interface CollectionCardProps {
  collection: Collection;
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
  onViewWords: (collection: Collection) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onEdit,
  onDelete,
  onViewWords,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xl">
            {collection.icon || collection.name[0]}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{collection.name}</h3>
            <p className="text-sm text-slate-500">{collection.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={DIFFICULTY_COLORS[collection.difficulty] || 'gray'}>
            {DIFFICULTY_OPTIONS.find((d) => d.value === collection.difficulty)?.label ||
              collection.difficulty}
          </Badge>
          {!collection.isPublic && (
            <Badge color="gray" size="sm">
              비공개
            </Badge>
          )}
        </div>
      </div>

      {collection.description && (
        <p className="mt-3 text-sm text-slate-600 line-clamp-2">
          {collection.description}
        </p>
      )}

      {/* Slug Display */}
      {collection.slug && (
        <div className="mt-2 flex items-center gap-2">
          <code className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
            /courses/{collection.slug}
          </code>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            {collection.wordCount}개 단어
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 학습 페이지에서 보기 */}
          {collection.slug && collection.isPublic && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/courses/${collection.slug}`, '_blank')}
              title="학습 페이지에서 보기"
            >
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onViewWords(collection)}>
            단어 보기
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(collection)}>
            수정
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(collection)}>
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------
// Collection Form Modal
// ---------------------------------------------
interface CollectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editCollection?: Collection | null;
  onSuccess: () => void;
}

const CollectionFormModal: React.FC<CollectionFormModalProps> = ({
  isOpen,
  onClose,
  editCollection,
  onSuccess,
}) => {
  const { createCollection, updateCollection, loading, error } = useCollectionMutations();
  const [form, setForm] = useState<CreateCollectionForm>({
    name: '',
    slug: '',
    description: '',
    icon: '',
    category: 'GENERAL',
    difficulty: 'INTERMEDIATE',
    isPublic: true,
  });

  useEffect(() => {
    if (editCollection) {
      setForm({
        name: editCollection.name,
        slug: editCollection.slug || '',
        description: editCollection.description || '',
        icon: editCollection.icon || '',
        category: editCollection.category,
        difficulty: editCollection.difficulty,
        isPublic: editCollection.isPublic,
      });
    } else {
      setForm({
        name: '',
        slug: '',
        description: '',
        icon: '',
        category: 'GENERAL',
        difficulty: 'INTERMEDIATE',
        isPublic: true,
      });
    }
  }, [editCollection, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let success;
    if (editCollection) {
      success = await updateCollection(editCollection.id, form);
    } else {
      success = await createCollection(form);
    }

    if (success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editCollection ? '단어장 수정' : '새 단어장 만들기'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        <Input
          label="단어장 이름"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="예: 수능 필수 단어 1000"
          required
        />

        <Input
          label="URL 슬러그"
          value={form.slug || ''}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
          placeholder="예: csat-starter-100 (자동 생성됨)"
          helperText="학습 페이지 URL에 사용됩니다. 비워두면 자동 생성됩니다."
        />

        <Textarea
          label="설명"
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="단어장에 대한 설명을 입력하세요"
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="카테고리"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={CATEGORY_OPTIONS}
          />

          <Select
            label="난이도"
            value={form.difficulty}
            onChange={(e) =>
              setForm({
                ...form,
                difficulty: e.target.value as 'BASIC' | 'INTERMEDIATE' | 'ADVANCED',
              })
            }
            options={DIFFICULTY_OPTIONS}
          />
        </div>

        <Input
          label="아이콘 (이모지)"
          value={form.icon || ''}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
          placeholder="예: 📚"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={form.isPublic}
            onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
            className="w-4 h-4 text-teal-500 rounded border-slate-300 focus:ring-teal-500"
          />
          <label htmlFor="isPublic" className="text-sm text-slate-700">
            공개 단어장 (사용자에게 표시)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {editCollection ? '수정하기' : '만들기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ---------------------------------------------
// Collection Words Modal
// ---------------------------------------------
interface CollectionWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection | null;
}

const CollectionWordsModal: React.FC<CollectionWordsModalProps> = ({
  isOpen,
  onClose,
  collection,
}) => {
  const { collection: collectionDetail, loading, fetchCollection } = useCollectionDetail();
  const { removeWordsFromCollection, loading: mutationLoading } = useCollectionMutations();

  useEffect(() => {
    if (isOpen && collection) {
      fetchCollection(collection.id);
    }
  }, [isOpen, collection, fetchCollection]);

  const handleRemoveWord = async (wordId: string) => {
    if (!collection) return;
    const success = await removeWordsFromCollection(collection.id, [wordId]);
    if (success) {
      fetchCollection(collection.id);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={collection ? `${collection.name} - 단어 목록` : '단어 목록'}
      size="lg"
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : collectionDetail?.words && collectionDetail.words.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {collectionDetail.words.map((word) => (
            <div
              key={word.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div>
                <span className="font-medium text-slate-900">{word.word}</span>
                <span className="ml-2 text-sm text-slate-500">
                  {word.definitionKo || word.definition}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge color="pink" size="sm">
                  {word.examCategory}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveWord(word.id)}
                  disabled={mutationLoading}
                >
                  <svg
                    className="w-4 h-4 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 mx-auto text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <p className="mt-4 text-slate-500">이 단어장에 단어가 없습니다.</p>
          <p className="text-sm text-slate-400">
            단어 관리에서 단어를 선택하여 추가할 수 있습니다.
          </p>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
        <Button variant="outline" onClick={onClose}>
          닫기
        </Button>
      </div>
    </Modal>
  );
};

// ---------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection | null;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  collection,
  onConfirm,
  loading,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="단어장 삭제" size="sm">
      <div className="space-y-4">
        <p className="text-slate-600">
          <span className="font-semibold text-slate-900">{collection?.name}</span>{' '}
          단어장을 삭제하시겠습니까?
        </p>
        <p className="text-sm text-slate-500">
          이 작업은 되돌릴 수 없습니다. 단어장에 포함된 단어는 삭제되지 않습니다.
        </p>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            삭제하기
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ---------------------------------------------
// Main VocabularySets Component
// ---------------------------------------------
export const VocabularySets: React.FC = () => {
  const { collections, loading, error, fetchCollections } = useCollections();
  const { deleteCollection, loading: deleteLoading } = useCollectionMutations();

  const [showForm, setShowForm] = useState(false);
  const [editCollection, setEditCollection] = useState<Collection | null>(null);
  const [showWords, setShowWords] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleEdit = useCallback((collection: Collection) => {
    setEditCollection(collection);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((collection: Collection) => {
    setCollectionToDelete(collection);
    setShowDeleteConfirm(true);
  }, []);

  const handleViewWords = useCallback((collection: Collection) => {
    setSelectedCollection(collection);
    setShowWords(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!collectionToDelete) return;

    const success = await deleteCollection(collectionToDelete.id);
    if (success) {
      setShowDeleteConfirm(false);
      setCollectionToDelete(null);
      fetchCollections();
    }
  };

  const handleFormSuccess = () => {
    fetchCollections();
    setEditCollection(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">단어장 관리</h2>
          <p className="text-sm text-slate-500 mt-1">
            단어장 컬렉션을 만들고 관리하세요
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditCollection(null);
            setShowForm(true);
          }}
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          새 단어장
        </Button>
      </div>

      {/* Error Alert */}
      {error && <Alert type="error">{error}</Alert>}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : collections.length > 0 ? (
        /* Collection Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewWords={handleViewWords}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <svg
            className="w-16 h-16 mx-auto text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            단어장이 없습니다
          </h3>
          <p className="mt-2 text-slate-500">
            첫 번째 단어장을 만들어 단어를 체계적으로 관리하세요.
          </p>
          <Button
            variant="primary"
            className="mt-6"
            onClick={() => setShowForm(true)}
          >
            단어장 만들기
          </Button>
        </div>
      )}

      {/* Modals */}
      <CollectionFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditCollection(null);
        }}
        editCollection={editCollection}
        onSuccess={handleFormSuccess}
      />

      <CollectionWordsModal
        isOpen={showWords}
        onClose={() => {
          setShowWords(false);
          setSelectedCollection(null);
        }}
        collection={selectedCollection}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setCollectionToDelete(null);
        }}
        collection={collectionToDelete}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default VocabularySets;
