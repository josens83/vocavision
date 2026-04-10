'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://vocavisionbackend-production.up.railway.app';
const INTERNAL_BASE = 'https://vocavisionbackend-production.up.railway.app';

interface QueueItem {
  id: string;
  wordId: string;
  word: { word: string; definition: string; definitionKo: string };
  visualType: 'CONCEPT' | 'RHYME';
  prompt: string;
  captionKo: string;
  captionEn: string;
  imageUrl: string | null;
  status: string;
  examCategory: string;
  attemptCount: number;
}

export default function ImageQAPage() {
  const { _hasHydrated } = useAuthStore();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING_QA' | 'MANUAL' | 'APPROVED'>('PENDING_QA');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editCaption, setEditCaption] = useState<{ id: string; ko: string; en: string } | null>(null);
  const [stats, setStats] = useState<{ pending: number; manual: number; approved: number }>({ pending: 0, manual: 0, approved: 0 });
  const [approving, setApproving] = useState(false);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'dohurnk1006';

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/image-qa?status=${filter}&pageSize=30&key=${ADMIN_KEY}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${INTERNAL_BASE}/internal/image-queue-stats?key=${process.env.NEXT_PUBLIC_ADMIN_KEY || ''}`);
      const data = await res.json();
      const s = data.stats || [];
      const sum = (st: string) => s.filter((x: any) => x.status === st).reduce((a: number, b: any) => a + b._count.id, 0);
      setStats({ pending: sum('PENDING_QA'), manual: sum('MANUAL'), approved: sum('APPROVED') });
    } catch (e) {}
  }, []);

  useEffect(() => { fetchItems(); fetchStats(); }, [fetchItems, fetchStats]);

  const approve = async (ids: string[]) => {
    setApproving(true);
    try {
      await fetch(`${API_BASE}/admin/image-qa/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ids }),
      });
      setSelected(new Set());
      await fetchItems();
      await fetchStats();
    } finally {
      setApproving(false);
    }
  };

  const reject = async (id: string) => {
    await fetch(`${API_BASE}/admin/image-qa/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ id, reason: 'poor_quality' }),
    });
    fetchItems();
  };

  const saveCaption = async () => {
    if (!editCaption) return;
    await fetch(`${API_BASE}/admin/image-qa/update-caption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ id: editCaption.id, captionKo: editCaption.ko, captionEn: editCaption.en }),
    });
    setEditCaption(null);
    fetchItems();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (!_hasHydrated) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📸 Image QA</h1>
        <div className="flex gap-3">
          {selected.size > 0 && (
            <button
              onClick={() => approve(Array.from(selected))}
              disabled={approving}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50"
            >
              {approving ? '처리 중...' : `✅ Approve Selected (${selected.size})`}
            </button>
          )}
          <button
            onClick={() => { fetchItems(); fetchStats(); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {([
          { label: 'Pending QA', count: stats.pending, color: 'amber', status: 'PENDING_QA' },
          { label: 'Manual (Whisk)', count: stats.manual, color: 'red', status: 'MANUAL' },
          { label: 'Approved', count: stats.approved, color: 'emerald', status: 'APPROVED' },
        ] as const).map(({ label, count, color, status }) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              filter === status ? 'border-current' : 'border-gray-200 bg-white hover:border-gray-300'
            } ${color === 'amber' ? 'text-amber-600 bg-amber-50' : color === 'red' ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}
          >
            <div className="text-3xl font-bold">{count}</div>
            <div className="text-sm text-gray-600 mt-1">{label}</div>
          </button>
        ))}
      </div>

      {/* Select All */}
      {filter === 'PENDING_QA' && items.length > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            checked={selected.size === items.length && items.length > 0}
            onChange={() => selected.size === items.length ? setSelected(new Set()) : setSelected(new Set(items.map(i => i.id)))}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm text-gray-600">전체 선택 ({items.length}개)</span>
          {selected.size > 0 && (
            <span className="text-sm text-emerald-600 font-medium">{selected.size}개 선택됨</span>
          )}
        </div>
      )}

      {/* Items */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">⏳</div>
          <div>로딩 중...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">✅</div>
          <div>{filter === 'PENDING_QA' ? 'QA 대기 이미지 없음' : '해당 항목 없음'}</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
                selected.has(item.id) ? 'border-emerald-400 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Card Header */}
              <div className="p-2.5 bg-gray-50 flex items-center gap-2">
                {filter === 'PENDING_QA' && (
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="w-4 h-4 cursor-pointer flex-shrink-0"
                  />
                )}
                <span className="font-bold text-gray-900 text-sm truncate">{item.word?.word}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                  item.visualType === 'CONCEPT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {item.visualType === 'CONCEPT' ? 'CON' : 'RHY'}
                </span>
              </div>

              {/* Image */}
              <div className="relative aspect-square bg-gray-100">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.word?.word} fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-center p-3">
                    <div className="text-2xl mb-1">🎨</div>
                    <div className="text-xs">Whisk 필요</div>
                  </div>
                )}
              </div>

              {/* Captions */}
              <div className="p-2.5 space-y-1">
                <p className="text-xs text-gray-700 line-clamp-2">
                  <span className="font-medium text-gray-500">KO</span> {item.captionKo}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  <span className="font-medium">EN</span> {item.captionEn}
                </p>
              </div>

              {/* Actions */}
              {filter === 'PENDING_QA' && (
                <div className="p-2 pt-0 grid grid-cols-3 gap-1">
                  <button
                    onClick={() => approve([item.id])}
                    className="py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 font-medium"
                  >
                    ✅
                  </button>
                  <button
                    onClick={() => setEditCaption({ id: item.id, ko: item.captionKo, en: item.captionEn })}
                    className="py-1.5 bg-amber-400 text-white text-xs rounded-lg hover:bg-amber-500 font-medium"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => reject(item.id)}
                    className="py-1.5 bg-red-400 text-white text-xs rounded-lg hover:bg-red-500 font-medium"
                  >
                    ❌
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Caption Edit Modal */}
      {editCaption && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-4">✏️ 캡션 수정</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Korean</label>
                <input
                  value={editCaption.ko}
                  onChange={e => setEditCaption({ ...editCaption, ko: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">English</label>
                <input
                  value={editCaption.en}
                  onChange={e => setEditCaption({ ...editCaption, en: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveCaption} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600">
                저장
              </button>
              <button onClick={() => setEditCaption(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
