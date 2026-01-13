/**
 * WordImageSection - Admin 단어 이미지 입력 폼
 *
 * 3-이미지 시각화 시스템을 위한 이미지 업로드/관리 컴포넌트
 * - Concept (의미): 단어 의미를 직관적으로 보여주는 이미지
 * - Mnemonic (연상): 한국어식 연상법에 맞는 이미지
 * - Rhyme (라이밍): 발음/라이밍 기반 상황 이미지
 *
 * 이미지는 백엔드 API를 통해 Supabase Storage에 저장됩니다.
 */

'use client';

import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface WordImageData {
  imageConceptUrl?: string;
  imageConceptCaption?: string;
  imageMnemonicUrl?: string;
  imageMnemonicCaption?: string;
  imageRhymeUrl?: string;
  imageRhymeCaption?: string;
}

interface WordImageSectionProps {
  word: WordImageData;
  onUpdate: (field: string, value: string) => void;
  /** 단어 ID (기존 단어 편집 시 필수, 새 단어 생성 시 없음) */
  wordId?: string;
}

// imageType 매핑: urlField -> API imageType
const URL_FIELD_TO_IMAGE_TYPE: Record<string, string> = {
  imageConceptUrl: 'CONCEPT',
  imageMnemonicUrl: 'MNEMONIC',
  imageRhymeUrl: 'RHYME',
};

const IMAGE_TYPES = [
  {
    key: 'Concept',
    label: '의미 이미지',
    description: '단어 의미를 직관적으로 보여주는 이미지',
    example: 'dormant → 휴화산 (dormant volcano)',
    urlField: 'imageConceptUrl',
    captionField: 'imageConceptCaption',
    color: 'blue',
  },
  {
    key: 'Mnemonic',
    label: '연상법 이미지',
    description: '한국어식 연상법에 맞는 이미지',
    example: 'dormant → 문 앞에서 졸고 있는 doorman',
    urlField: 'imageMnemonicUrl',
    captionField: 'imageMnemonicCaption',
    color: 'green',
  },
  {
    key: 'Rhyme',
    label: '라이밍 이미지',
    description: '발음/라이밍 기반 상황 이미지',
    example: 'daunting to dormant man',
    urlField: 'imageRhymeUrl',
    captionField: 'imageRhymeCaption',
    color: 'purple',
  },
];

const COLOR_CLASSES: Record<string, { badge: string; border: string }> = {
  blue: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    border: 'border-blue-200 hover:border-blue-300',
  },
  green: {
    badge: 'bg-green-100 text-green-700 border-green-200',
    border: 'border-green-200 hover:border-green-300',
  },
  purple: {
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    border: 'border-purple-200 hover:border-purple-300',
  },
};

export default function WordImageSection({
  word,
  onUpdate,
  wordId,
}: WordImageSectionProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    urlField: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setUploading(urlField);
    setError(null);
    setSuccess(null);

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

      // wordId가 있으면 백엔드 API를 통해 Supabase Storage에 업로드
      if (wordId) {
        const imageType = URL_FIELD_TO_IMAGE_TYPE[urlField];
        const response = await api.post<{
          success: boolean;
          data?: { visual: { imageUrl: string } };
          error?: string;
        }>(`/admin/words/${wordId}/upload-image`, {
          imageType,
          imageBase64,
        });

        if (response.data.success && response.data.data?.visual.imageUrl) {
          onUpdate(urlField, response.data.data.visual.imageUrl);
          setSuccess('이미지가 업로드되었습니다.');
        } else {
          throw new Error(response.data.error || '업로드 실패');
        }
      } else {
        // wordId가 없으면 (새 단어 생성 시) 로컬 미리보기만 표시
        // 실제 저장은 단어 저장 시 처리됨
        const dataUrl = `data:${file.type};base64,${imageBase64}`;
        onUpdate(urlField, dataUrl);
        setSuccess('이미지 미리보기가 설정되었습니다. 단어 저장 시 업로드됩니다.');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : '이미지 업로드에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveImage = (urlField: string) => {
    onUpdate(urlField, '');
    setSuccess(null);
  };

  const handleUrlInput = (urlField: string, url: string) => {
    onUpdate(urlField, url);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">
          단어 시각화 이미지 (3종)
        </h3>
        {!wordId && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            새 단어 - 저장 후 이미지 업로드 가능
          </span>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 성공 메시지 */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* 이미지 타입별 입력 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {IMAGE_TYPES.map((type) => {
          const imageUrl = word[type.urlField as keyof WordImageData] as string;
          const caption = word[type.captionField as keyof WordImageData] as string;
          const colors = COLOR_CLASSES[type.color];

          return (
            <div
              key={type.key}
              className={`border-2 rounded-xl p-4 transition-colors ${colors.border}`}
            >
              {/* 타입 헤더 */}
              <div className="mb-4">
                <span
                  className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${colors.badge}`}
                >
                  {type.key}
                </span>
                <h4 className="font-medium text-gray-900 mt-2">{type.label}</h4>
                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                <p className="text-xs text-gray-400 mt-1 italic">
                  예: {type.example}
                </p>
              </div>

              {/* 이미지 업로드/미리보기 */}
              <div className="space-y-3">
                {/* 이미지 영역 */}
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                  {imageUrl ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={imageUrl}
                        alt={type.label}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(type.urlField)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                      {uploading === type.urlField ? (
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">
                            이미지 업로드
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            또는 URL 직접 입력
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, type.urlField)}
                        disabled={uploading === type.urlField}
                      />
                    </label>
                  )}
                </div>

                {/* URL 직접 입력 */}
                <input
                  type="url"
                  value={imageUrl || ''}
                  onChange={(e) => handleUrlInput(type.urlField, e.target.value)}
                  placeholder="이미지 URL 직접 입력"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />

                {/* 캡션 입력 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    캡션 (한글)
                  </label>
                  <textarea
                    value={caption || ''}
                    onChange={(e) => onUpdate(type.captionField, e.target.value)}
                    placeholder={`예: ${type.example}`}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 도움말 */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium mb-2">이미지 제작 가이드</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>
            <strong>Concept</strong>: 사전/교과서에서 볼 법한 정석 장면 (실제 사용
            예시 시각화)
          </li>
          <li>
            <strong>Mnemonic</strong>: 한국 학생이 피식 웃을 연상법 (과장된 상황,
            친숙한 소재)
          </li>
          <li>
            <strong>Rhyme</strong>: 발음을 쪼갠 키워드를 장면에 배치 (여러 요소
            조합)
          </li>
        </ul>
        <p className="mt-2 text-xs text-gray-500">
          권장: 1:1 정사각형, 카툰/일러스트 스타일, Whisk/DALL-E/Midjourney 활용
        </p>
      </div>
    </div>
  );
}
