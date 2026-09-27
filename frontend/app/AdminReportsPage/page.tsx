'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, RefreshCw, X } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';

type Report = {
  id: number;
  reason: string;
  details: string | null;
  created_at: string;
  reporter: { id: number; name: string };
  target: { id: number; name: string; email: string; valid_report_count: number; is_banned: boolean };
};

const reasonTranslationKeys: Record<string, string> = {
  fraud: 'reportFraud',
  harassment: 'reportHarassment',
  unsafe_behavior: 'reportUnsafe',
  misleading_listing: 'reportMisleading',
  other: 'reportOther',
};

export default function AdminReportsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/admin/reports?status=pending`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('adminReportsLoadError'));
      setReports(data.reports || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('adminReportsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [API, t]);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const resolveReport = async (reportId: number, status: 'valid' | 'rejected') => {
    setResolving(reportId);
    setError('');
    try {
      const response = await fetch(`${API}/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('adminReviewError'));
      await loadReports();
      if (status === 'valid' && data.report?.target?.is_banned) {
        setError(t('adminBanNotice').replace('{name}', data.report.target.name));
      }
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : t('adminReviewError'));
    } finally {
      setResolving(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#edf4f2] text-[#183a38] dark:bg-[#071b19] dark:text-[#e5f5f1]">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-black/10 pb-5 dark:border-white/10">
          <div>
            <button type="button" onClick={() => router.push(ROUTES.HOME)} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#42625e] hover:text-[#0f766e] dark:text-[#a3c6bf]">
              <ArrowLeft className="h-4 w-4" /> {t('adminReportsBack')}
            </button>
            <h1 className="text-2xl font-bold">{t('adminReportsTitle')}</h1>
            <p className="mt-1 text-sm text-[#58716d] dark:text-[#a3c6bf]">{t('adminReportsIntro')}</p>
          </div>
          <button type="button" onClick={() => void loadReports()} disabled={loading} aria-label={t('adminRefreshReports')} className="rounded-md border border-black/15 p-2 hover:bg-white disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {error && <p role="status" className="mt-5 border-l-4 border-amber-600 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">{error}</p>}
        {loading ? <p className="py-10 text-sm text-[#58716d] dark:text-[#a3c6bf]">{t('adminReportsLoading')}</p> : reports.length === 0 ? (
          <p className="py-10 text-sm text-[#58716d] dark:text-[#a3c6bf]">{t('adminReportsEmpty')}</p>
        ) : (
          <div className="mt-5 divide-y divide-black/10 dark:divide-white/10">
            {reports.map((report) => (
              <article key={report.id} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h2 className="font-bold">{report.target.name || report.target.email}</h2>
                    <span className="text-xs text-[#58716d] dark:text-[#a3c6bf]">{report.target.email}</span>
                    <span className="rounded-sm bg-[#dcebe7] px-2 py-1 text-xs font-semibold dark:bg-[#173b35]">{report.target.valid_report_count}/3 {t('validReports')}</span>
                  </div>
                  <p className="mt-2 text-sm"><span className="font-semibold">{t(reasonTranslationKeys[report.reason] || report.reason)}</span> · {t('reportedBy')} {report.reporter.name || t('adminUserFallback').replace('{id}', String(report.reporter.id))}</p>
                  {report.details && <p className="mt-2 whitespace-pre-wrap text-sm text-[#58716d] dark:text-[#a3c6bf]">{report.details}</p>}
                  <p className="mt-2 text-xs text-[#58716d] dark:text-[#a3c6bf]">{new Date(report.created_at).toLocaleString(language)}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={resolving === report.id} onClick={() => void resolveReport(report.id, 'rejected')} className="inline-flex items-center gap-1 rounded-md border border-black/15 px-3 py-2 text-sm font-semibold hover:bg-white disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10">
                    <X className="h-4 w-4" /> {t('adminReject')}
                  </button>
                  <button type="button" disabled={resolving === report.id} onClick={() => void resolveReport(report.id, 'valid')} className="inline-flex items-center gap-1 rounded-md bg-[#126b5b] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0d5548] disabled:opacity-50">
                    <Check className="h-4 w-4" /> {t('adminMarkValid')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}