'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardData {
  quotas: { segment: string; current_count: number; min_target: number; max_target: number }[] | null;
  fillCounts: { retailer_code: string; count: number }[] | null;
  metrics: {
    total: number;
    complete: number;
    terminated: number;
    inProgress: number;
    avgDuration: number;
    termBreakdown: Record<string, number>;
    segmentCounts: Record<string, number>;
    deviceCounts: Record<string, number>;
  };
  demographics: {
    incomeCounts: Record<string, number>;
    ageCounts: Record<string, number>;
  };
  qcFlags: Record<string, number>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const res = await fetch('/api/admin/export');
    if (res.status === 401) {
      router.push('/admin/login');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fareway_survey_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-error">{error || 'Failed to load data.'}</p>
      </div>
    );
  }

  const { quotas, fillCounts, metrics, demographics, qcFlags } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Fareway Survey Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const testId = `TEST_${Date.now()}`;
                window.open(`/survey?rid=${testId}&src=admin_test`, '_blank');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Test Survey
            </button>
            <button onClick={handleExport} className="btn-primary">
              Export CSV
            </button>
          </div>
        </div>

        {/* Completion Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Completion Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard label="Total Started" value={metrics.total} />
            <MetricCard label="Completed" value={metrics.complete} color="text-success" />
            <MetricCard label="Terminated" value={metrics.terminated} color="text-error" />
            <MetricCard label="In Progress" value={metrics.inProgress} color="text-primary" />
          </div>
          {metrics.avgDuration > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Average completion time: {Math.round(metrics.avgDuration / 60)} minutes
            </p>
          )}
        </section>

        {/* Quota Fill Status */}
        {quotas && quotas.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Segment Quotas</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Segment</th>
                    <th className="text-right p-3 font-medium text-gray-600">Current</th>
                    <th className="text-right p-3 font-medium text-gray-600">Min</th>
                    <th className="text-right p-3 font-medium text-gray-600">Max</th>
                    <th className="text-right p-3 font-medium text-gray-600">Fill %</th>
                  </tr>
                </thead>
                <tbody>
                  {quotas.map((q) => {
                    const fillPct = q.max_target > 0 ? Math.round((q.current_count / q.max_target) * 100) : 0;
                    return (
                      <tr key={q.segment} className="border-t border-gray-100">
                        <td className="p-3 font-medium">{q.segment.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-right">{q.current_count}</td>
                        <td className="p-3 text-right text-gray-500">{q.min_target}</td>
                        <td className="p-3 text-right text-gray-500">{q.max_target}</td>
                        <td className="p-3 text-right">
                          <span className={fillPct >= 100 ? 'text-success font-bold' : ''}>
                            {fillPct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Retailer Least-Fill */}
        {fillCounts && fillCounts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Retailer Fill Counts (Least-Fill Order)</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Store</th>
                    <th className="text-right p-3 font-medium text-gray-600">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {fillCounts.map((f) => (
                    <tr key={f.retailer_code} className="border-t border-gray-100">
                      <td className="p-3">{f.retailer_code}</td>
                      <td className="p-3 text-right">{f.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Termination Breakdown */}
        {Object.keys(metrics.termBreakdown).length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Termination Breakdown</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Reason</th>
                    <th className="text-right p-3 font-medium text-gray-600">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metrics.termBreakdown).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                    <tr key={reason} className="border-t border-gray-100">
                      <td className="p-3">{reason}</td>
                      <td className="p-3 text-right">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Demographics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {Object.keys(demographics.incomeCounts).length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Income Distribution</h2>
              <div className="bg-white rounded-lg shadow p-4">
                {Object.entries(demographics.incomeCounts).map(([band, count]) => (
                  <div key={band} className="flex justify-between py-1 text-sm">
                    <span className="text-gray-700">{band.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {Object.keys(demographics.ageCounts).length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Age Distribution</h2>
              <div className="bg-white rounded-lg shadow p-4">
                {Object.entries(demographics.ageCounts).map(([cohort, count]) => (
                  <div key={cohort} className="flex justify-between py-1 text-sm">
                    <span className="text-gray-700">{cohort.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* QC Flags */}
        {Object.values(qcFlags).some((v) => v > 0) && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Quality Control Flags</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Flag</th>
                    <th className="text-right p-3 font-medium text-gray-600">Count</th>
                    <th className="text-right p-3 font-medium text-gray-600">% of Complete</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(qcFlags).map(([flag, count]) => (
                    <tr key={flag} className="border-t border-gray-100">
                      <td className="p-3">{flag.replace(/_/g, ' ')}</td>
                      <td className="p-3 text-right">{count}</td>
                      <td className="p-3 text-right">
                        {metrics.complete > 0 ? Math.round((count / metrics.complete) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Device Breakdown */}
        {Object.keys(metrics.deviceCounts).length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Device Breakdown</h2>
            <div className="bg-white rounded-lg shadow p-4">
              {Object.entries(metrics.deviceCounts).map(([device, count]) => (
                <div key={device} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-700 capitalize">{device}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color || 'text-gray-900'}`}>{value.toLocaleString()}</p>
    </div>
  );
}
