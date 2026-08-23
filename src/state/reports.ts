import { DEFAULT_STORE, type StorageLike } from './storage';
import { Linking } from 'react-native';

export const REPORTS_KEY = 'egg:reports';
export const REPORTS_VERSION = 1;

export interface ContentReport {
  id: string;
  questionId: string;
  note: string;
  timestamp: string;
  appVersion: string;
  version: number;
}

function normalizeReport(value: unknown): ContentReport | null {
  if (!value || typeof value !== 'object') return null;
  const report = value as Partial<ContentReport>;
  if (
    typeof report.id !== 'string' ||
    typeof report.questionId !== 'string' ||
    typeof report.note !== 'string' ||
    typeof report.timestamp !== 'string'
  ) {
    return null;
  }
  return {
    id: report.id,
    questionId: report.questionId,
    note: report.note,
    timestamp: report.timestamp,
    appVersion: typeof report.appVersion === 'string' ? report.appVersion : '1.0.0',
    version: typeof report.version === 'number' ? report.version : REPORTS_VERSION,
  };
}

export async function loadReports(store: StorageLike = DEFAULT_STORE): Promise<ContentReport[]> {
  const raw = await store.getItem(REPORTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeReport).filter((report): report is ContentReport => report !== null);
  } catch {
    return [];
  }
}

export async function saveReports(
  reports: ContentReport[],
  store: StorageLike = DEFAULT_STORE,
): Promise<void> {
  await store.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export async function createReport(
  questionId: string,
  note = '',
  store: StorageLike = DEFAULT_STORE,
  now = () => new Date().toISOString(),
): Promise<ContentReport> {
  const timestamp = now();
  const report: ContentReport = {
    id: `${questionId}:${timestamp}`,
    questionId,
    note,
    timestamp,
    appVersion: '1.0.0',
    version: REPORTS_VERSION,
  };
  const reports = await loadReports(store);
  await saveReports([...reports, report], store);
  return report;
}

export async function updateReport(
  id: string,
  note: string,
  store: StorageLike = DEFAULT_STORE,
): Promise<ContentReport[]> {
  const reports = await loadReports(store);
  const next = reports.map(report => (report.id === id ? { ...report, note } : report));
  await saveReports(next, store);
  return next;
}

export async function clearReports(store: StorageLike = DEFAULT_STORE): Promise<void> {
  await store.removeItem(REPORTS_KEY);
}

export function buildReportsMailto(reports: ContentReport[]): string {
  const body = reports.map(report => `${report.questionId}\n${report.note || '(no note)'}\n${report.timestamp}`).join('\n\n');
  return `mailto:?subject=${encodeURIComponent('English Grammar Game content report')}&body=${encodeURIComponent(body)}`;
}

export async function exportReports(reports: ContentReport[]): Promise<void> {
  await Linking.openURL(buildReportsMailto(reports));
}
