/**
 * WordVisualsEditor - Admin 단어 시각화 편집기
 *
 * 3-이미지 시각화 시스템을 위한 종합 편집 컴포넌트
 * - Concept (의미): 단어 의미를 직관적으로 보여주는 이미지
 * - Mnemonic (연상): 한국어식 연상법에 맞는 이미지
 * - Rhyme (라이밍): 발음/라이밍 기반 상황 이미지
 *
 * 기능:
 * - 이중 언어 라벨/캡션 (En/Ko)
 * - 이미지 업로드 (Cloudinary) 또는 URL 직접 입력
 * - AI 이미지 생성 프롬프트 저장
 * - JSON 템플릿 가져오기
 * - GIF 지원
 */

'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  FileJson,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import {
  VisualType,
  WordVisual,
  WordVisualInput,
  VisualTemplate,
  VISUAL_TYPE_CONFIG,
} from './types/admin.types';

interface WordVisualsEditorProps {
  wordId?: string;
  word: string; // Display word for context
  visuals: WordVisual[];
  onChange: (visuals: WordVisualInput[]) => void;
  cloudinaryCloudName?: string;
  onJsonImport?: (template: VisualTemplate) => void;
  onImageDelete?: (type: string, updatedVisuals: WordVisualInput[]) => void | Promise<void>;
  onGenerateAllImages?: () => void;
  onGenerateSingleImage?: (type: VisualType) => void;
  onGeneratePrompt?: (type: VisualType) => void;
  generatingType?: VisualType | 'ALL' | null;
  wordData?: {
    definitionEn?: string;
    definitionKo?: string;
    mnemonic?: string;
    mnemonicKorean?: string;
    rhymingWords?: string[];
  };
}

const VISUAL_TYPES: VisualType[] = ['CONCEPT', 'MNEMONIC', 'RHYME'];

export default function WordVisualsEditor({
  word,
  visuals,
  onChange,
  cloudinaryCloudName,
  onJsonImport,
  onImageDelete,
  onGenerateAllImages,
  onGenerateSingleImage,
  onGeneratePrompt,
  generatingType,
  wordData,
}: WordVisualsEditorProps) {
  const [uploading, setUploading] = useState<VisualType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<VisualType | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Get visual for a specific type (or create empty one)
  const getVisual = (type: VisualType): WordVisualInput => {
    const existing = visuals.find((v) => v.type === type);
    if (existing) {
      return {
        type: existing.type,
        labelEn: existing.labelEn,
        labelKo: existing.labelKo,
        captionEn: existing.captionEn,
        captionKo: existing.captionKo,
        imageUrl: existing.imageUrl || undefined,
        promptEn: existing.promptEn,
        order: existing.order,
      };
    }
    const config = VISUAL_TYPE_CONFIG[type];
    return {
      type,
      labelEn: config.labelEn,
      labelKo: config.labelKo,
      order: VISUAL_TYPES.indexOf(type),
    };
  };

  // Update a specific visual
  const updateVisual = (type: VisualType, updates: Partial<WordVisualInput>) => {
    const currentVisuals = VISUAL_TYPES.map(getVisual);
    const updatedVisuals = currentVisuals.map((v) =>
      v.type === type ? { ...v, ...updates } : v
    );
    onChange(updatedVisuals);
  };

  // Handle image upload
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: VisualType
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (support images and GIFs)
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setUploading(type);
    setError(null);

    try {
      if (cloudinaryCloudName) {
        // Cloudinary upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'vocavision');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('업로드 실패');
        }

        const data = await response.json();
        updateVisual(type, { imageUrl: data.secure_url });
      } else {
        // Local preview (development)
        const reader = new FileReader();
        reader.onload = () => {
          updateVisual(type, { imageUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(null);
    }
  };

  // Handle JSON import
  const handleJsonImport = () => {
    try {
      const template: VisualTemplate = JSON.parse(jsonInput);
      if (!template.visuals) {
        throw new Error('Invalid template format');
      }

      // Convert template to visuals array
      const importedVisuals: WordVisualInput[] = [];

      if (template.visuals.concept) {
        importedVisuals.push({
          type: 'CONCEPT',
          labelEn: 'Concept',
          labelKo: template.visuals.concept.labelKo || '의미',
          captionEn: template.visuals.concept.captionEn,
          captionKo: template.visuals.concept.captionKo,
          imageUrl: template.visuals.concept.imageUrl,
          promptEn: template.visuals.concept.promptEn,
          order: 0,
        });
      }

      if (template.visuals.mnemonic) {
        importedVisuals.push({
          type: 'MNEMONIC',
          labelEn: 'Mnemonic',
          labelKo: template.visuals.mnemonic.labelKo || '연상',
          captionEn: template.visuals.mnemonic.captionEn,
          captionKo: template.visuals.mnemonic.captionKo,
          imageUrl: template.visuals.mnemonic.imageUrl,
          promptEn: template.visuals.mnemonic.promptEn,
          order: 1,
        });
      }

      if (template.visuals.rhyme) {
        importedVisuals.push({
          type: 'RHYME',
          labelEn: 'Rhyme',
          labelKo: template.visuals.rhyme.labelKo || '라이밍',
          captionEn: template.visuals.rhyme.captionEn,
          captionKo: template.visuals.rhyme.captionKo,
          imageUrl: template.visuals.rhyme.imageUrl,
          promptEn: template.visuals.rhyme.promptEn,
          order: 2,
        });
      }

      // Merge with existing visuals
      const mergedVisuals = VISUAL_TYPES.map((type) => {
        const imported = importedVisuals.find((v) => v.type === type);
        const existing = getVisual(type);
        return imported ? { ...existing, ...imported } : existing;
      });

      onChange(mergedVisuals);
      setShowJsonImport(false);
      setJsonInput('');

      if (onJsonImport) {
        onJsonImport(template);
      }
    } catch (err) {
      setError('JSON 형식이 올바르지 않습니다.');
    }
  };

  // Copy prompt to clipboard
  const handleCopyPrompt = async (type: VisualType) => {
    const visual = getVisual(type);
    if (visual.promptEn) {
      await navigator.clipboard.writeText(visual.promptEn);
      setCopiedPrompt(type);
      setTimeout(() => setCopiedPrompt(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">
            단어 시각화 이미지 (3종)
          </h3>
          <span className="text-sm text-gray-500">"{word}"</span>
        </div>

        <button
          onClick={() => setShowJsonImport(!showJsonImport)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <FileJson className="w-4 h-4" />
          JSON 가져오기
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* JSON Import Panel */}
      {showJsonImport && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">
            JSON 템플릿 붙여넣기
          </p>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={`{
  "word": "${word}",
  "visuals": {
    "concept": { "captionKo": "...", "promptEn": "..." },
    "mnemonic": { "captionKo": "...", "promptEn": "..." },
    "rhyme": { "captionKo": "...", "promptEn": "..." }
  }
}`}
            rows={8}
            className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleJsonImport}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition"
            >
              가져오기
            </button>
            <button
              onClick={() => {
                setShowJsonImport(false);
                setJsonInput('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Visual Type Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {VISUAL_TYPES.map((type) => {
          const config = VISUAL_TYPE_CONFIG[type];
          const visual = getVisual(type);

          return (
            <div
              key={type}
              className={`border-2 rounded-xl p-4 transition-colors ${config.lightColor.replace('text-', 'border-').split(' ')[0]} hover:shadow-md`}
            >
              {/* Type Header */}
              <div className="mb-4">
                <span
                  className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${config.lightColor}`}
                >
                  {config.labelEn}
                </span>
                <h4 className="font-medium text-gray-900 mt-2">
                  {config.labelKo}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {config.description}
                </p>
                <p className="text-xs text-gray-400 mt-1 italic">
                  예: {config.example}
                </p>
              </div>

              {/* Image Upload/Preview */}
              <div className="space-y-3">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                  {visual.imageUrl ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={visual.imageUrl}
                        alt={config.labelKo}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => updateVisual(type, { imageUrl: undefined })}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                      {uploading === type ? (
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">
                            이미지/GIF 업로드
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            또는 URL 직접 입력
                          </span>
                        </>
                      )}
                      <input
                        ref={(el) => { fileInputRefs.current[type] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, type)}
                        disabled={uploading === type}
                      />
                    </label>
                  )}
                </div>

                {/* URL Input */}
                <input
                  type="url"
                  value={visual.imageUrl || ''}
                  onChange={(e) => updateVisual(type, { imageUrl: e.target.value })}
                  placeholder="이미지 URL 직접 입력"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />

                {/* Korean Caption */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    캡션 (한국어)
                  </label>
                  <textarea
                    value={visual.captionKo || ''}
                    onChange={(e) => updateVisual(type, { captionKo: e.target.value })}
                    placeholder={`예: ${config.example}`}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* English Caption (optional) */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    캡션 (영어) - 선택
                  </label>
                  <textarea
                    value={visual.captionEn || ''}
                    onChange={(e) => updateVisual(type, { captionEn: e.target.value })}
                    placeholder="English caption (optional)"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* AI Prompt */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                    <Sparkles className="w-3 h-3" />
                    AI 이미지 생성 프롬프트
                  </label>
                  <div className="relative">
                    <textarea
                      value={visual.promptEn || ''}
                      onChange={(e) => updateVisual(type, { promptEn: e.target.value })}
                      placeholder="DALL-E / Midjourney prompt..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none pr-10"
                    />
                    {visual.promptEn && (
                      <button
                        onClick={() => handleCopyPrompt(type)}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 transition"
                        title="프롬프트 복사"
                      >
                        {copiedPrompt === type ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium mb-2">이미지 제작 가이드</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>
            <strong>Concept</strong>: 사전/교과서에서 볼 법한 정석 장면 (실제
            사용 예시 시각화)
          </li>
          <li>
            <strong>Mnemonic</strong>: 한국 학생이 피식 웃을 연상법 (과장된
            상황, 친숙한 소재)
          </li>
          <li>
            <strong>Rhyme</strong>: 발음을 쪼갠 키워드를 장면에 배치 (여러
            요소 조합)
          </li>
        </ul>
        <p className="mt-2 text-xs text-gray-500">
          권장: 1:1 정사각형, 카툰/일러스트 스타일 | GIF: 3초 루프, 480×480px
          이상 | Whisk/DALL-E/Midjourney 활용
        </p>
      </div>
    </div>
  );
}
