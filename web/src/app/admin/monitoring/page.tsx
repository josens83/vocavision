// Phase 4-4: Real-time Monitoring Dashboard
// Admin dashboard for performance and error monitoring

'use client';

import { useState, useEffect } from 'react';
import { getAPMSummary } from '@/lib/monitoring/apm';
import { retryMetrics } from '@/lib/utils/retry';
import { circuitBreakerManager } from '@/lib/utils/circuitBreaker';
import { getStorageStats } from '@/lib/utils/indexedDB';

export default function MonitoringDashboard() {
  const [apmSummary, setAPMSummary] = useState<any>(null);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [circuitBreakers, setCircuitBreakers] = useState<any[]>([]);
  const [retryStats, setRetryStats] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);

  useEffect(() => {
    loadMetrics();

    const interval = setInterval(() => {
      loadMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadMetrics = async () => {
    // APM metrics
    const apm = getAPMSummary();
    setAPMSummary(apm);

    // Storage stats
    const storage = await getStorageStats();
    setStorageStats(storage);

    // Circuit breakers
    const breakers = circuitBreakerManager.getAllMetrics();
    setCircuitBreakers(breakers);

    // Retry metrics
    const retry = retryMetrics.getMetrics();
    setRetryStats(retry);
  };

  if (!apmSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">모니터링 대시보드</h1>
          <p className="text-gray-600">실시간 성능 및 오류 모니터링</p>
        </div>

        {/* Refresh Controls */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={loadMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              새로고침
            </button>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-4 py-2 border rounded-lg"
            >
              <option value={5000}>5초</option>
              <option value={10000}>10초</option>
              <option value={30000}>30초</option>
              <option value={60000}>1분</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            마지막 업데이트: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* API Requests */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">API 요청</h2>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              title="총 요청"
              value={apmSummary.requests.total}
              icon="📊"
              color="blue"
            />
            <MetricCard
              title="성공"
              value={apmSummary.requests.success}
              icon="✅"
              color="green"
            />
            <MetricCard
              title="실패"
              value={apmSummary.requests.failed}
              icon="❌"
              color="red"
            />
            <MetricCard
              title="평균 응답시간"
              value={`${apmSummary.requests.avgDuration}ms`}
              icon="⏱️"
              color="purple"
            />
          </div>

          {apmSummary.requests.slowest && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-bold text-yellow-900 mb-2">🐌 가장 느린 요청</h3>
              <div className="text-sm">
                <p>
                  <strong>URL:</strong> {apmSummary.requests.slowest.url}
                </p>
                <p>
                  <strong>Duration:</strong> {apmSummary.requests.slowest.duration}ms
                </p>
                <p>
                  <strong>Status:</strong> {apmSummary.requests.slowest.status}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Resources */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">리소스</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <MetricCard
              title="총 리소스"
              value={apmSummary.resources.total}
              icon="📦"
              color="blue"
            />
            <MetricCard
              title="총 크기"
              value={`${(apmSummary.resources.totalSize / 1024 / 1024).toFixed(2)}MB`}
              icon="💾"
              color="green"
            />
            <MetricCard
              title="평균 로딩시간"
              value={`${apmSummary.resources.avgDuration}ms`}
              icon="⚡"
              color="purple"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {Object.entries(apmSummary.resources.byType).map(([type, count]) => (
              <div key={type} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{type}</div>
                <div className="text-2xl font-bold">{count as number}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Errors */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">오류</h2>
          <MetricCard title="총 오류" value={apmSummary.errors.total} icon="🔥" color="red" />

          {apmSummary.errors.recent.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">최근 오류</h3>
              <div className="space-y-2">
                {apmSummary.errors.recent.map((error: any, i: number) => (
                  <div key={i} className="p-3 bg-red-50 rounded-lg text-sm">
                    <p className="font-mono text-red-900">{error.message}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      {new Date(error.timestamp).toLocaleString()} - {error.url}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Circuit Breakers */}
        {circuitBreakers.length > 0 && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Circuit Breakers</h2>
            <div className="space-y-3">
              {circuitBreakers.map((breaker) => (
                <div
                  key={breaker.name}
                  className={`p-4 rounded-lg ${
                    breaker.state === 'OPEN'
                      ? 'bg-red-50'
                      : breaker.state === 'HALF_OPEN'
                      ? 'bg-yellow-50'
                      : 'bg-green-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">{breaker.name}</h3>
                      <p className="text-sm text-gray-600">
                        State: {breaker.state} | Failures: {breaker.failureCount} | Requests:{' '}
                        {breaker.totalRequests}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        breaker.state === 'OPEN'
                          ? 'bg-red-200 text-red-900'
                          : breaker.state === 'HALF_OPEN'
                          ? 'bg-yellow-200 text-yellow-900'
                          : 'bg-green-200 text-green-900'
                      }`}
                    >
                      {breaker.state}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retry Statistics */}
        {retryStats && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Retry 통계</h2>
            <div className="grid grid-cols-4 gap-4">
              <MetricCard
                title="총 요청"
                value={retryStats.totalRequests}
                icon="🔄"
                color="blue"
              />
              <MetricCard
                title="성공"
                value={retryStats.successfulRequests}
                icon="✅"
                color="green"
              />
              <MetricCard
                title="재시도한 요청"
                value={retryStats.retriedRequests}
                icon="🔁"
                color="yellow"
              />
              <MetricCard
                title="평균 재시도"
                value={retryStats.averageRetries.toFixed(2)}
                icon="📊"
                color="purple"
              />
            </div>
          </div>
        )}

        {/* Storage */}
        {storageStats && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">스토리지</h2>
            <div className="grid grid-cols-3 gap-4">
              <MetricCard
                title="사용량"
                value={`${storageStats.usage}MB`}
                icon="💾"
                color="blue"
              />
              <MetricCard
                title="한도"
                value={`${storageStats.quota}MB`}
                icon="📊"
                color="green"
              />
              <MetricCard
                title="사용률"
                value={`${storageStats.percentage}%`}
                icon="📈"
                color="purple"
              />
            </div>

            {storageStats.percentage > 80 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="text-red-900 font-bold">⚠️ 스토리지 사용량이 높습니다!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-cyan-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-lg p-4`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm opacity-90">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
