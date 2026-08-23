/**
 * Local error log — the no-third-party crash/error capture for a shipped app.
 *
 * Task 3 establishes the local-first fallback from docs/app-plan.md: a
 * `global.ErrorUtils` hook (src/app/errorReporting.ts) appends uncaught JS
 * errors here, under `egg:errors`, so they are reachable by the developer and
 * exportable as a mailto. The log is bounded (oldest entries dropped) and is
 * stored under its own key so it survives a progress reset — it is diagnostics,
 * not learning progress.
 *
 * Sentry (optional, release infra) is documented in docs/release.md as the
 * third-party alternative; this module is the zero-dependency default.
 */

import { DEFAULT_STORE, type StorageLike } from './storage';

/** Storage key for the error log — separate from settings and progress on purpose. */
export const ERRORS_KEY = 'egg:errors';

/** Cap on retained entries — the log is bounded so it never grows without bound. */
export const ERROR_LOG_CAP = 50;

/** One captured error. */
export interface ErrorLogEntry {
  /** Unique id (assigned on record). */
  id: string;
  /** Human-readable message. */
  message: string;
  /** Stack trace, when the error carried one. */
  stack?: string;
  /** ISO timestamp of when the error occurred. */
  timestamp: string;
  /** App version the error happened in (from app.json). */
  appVersion: string;
  /** Whether the error was fatal (terminates the JS thread). */
  isFatal: boolean;
}

/** Unique-enough id for a log entry — no native module or crypto dependency. */
export function makeErrorId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Read the current error log. Returns an empty list when nothing is stored or
 * the stored value is malformed — error capture must never throw into the app
 * that just crashed.
 */
export async function loadErrors(store: StorageLike = DEFAULT_STORE): Promise<ErrorLogEntry[]> {
  const raw = await store.getItem(ERRORS_KEY);
  if (raw === null) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as ErrorLogEntry[];
  } catch {
    return [];
  }
}

/**
 * Append an entry to the log, dropping the oldest past `ERROR_LOG_CAP`, and
 * persist. Assigns the entry's id. Returns the stored entry.
 */
export async function recordError(
  entry: Omit<ErrorLogEntry, 'id'>,
  store: StorageLike = DEFAULT_STORE,
): Promise<ErrorLogEntry> {
  const errors = await loadErrors(store);
  const withId: ErrorLogEntry = { ...entry, id: makeErrorId() };
  const next = [...errors, withId];
  if (next.length > ERROR_LOG_CAP) {
    next.splice(0, next.length - ERROR_LOG_CAP);
  }
  await store.setItem(ERRORS_KEY, JSON.stringify(next));
  return withId;
}

/** Clear the log (after a successful export). */
export async function clearErrors(store: StorageLike = DEFAULT_STORE): Promise<void> {
  await store.removeItem(ERRORS_KEY);
}

export interface ErrorReportMeta {
  /** App display name for the subject line. */
  appName: string;
  /** Developer support inbox. */
  to: string;
}

/** Compose the human-readable report body from the current log. */
export function composeErrorReport(
  errors: ErrorLogEntry[],
  meta: ErrorReportMeta,
): { subject: string; body: string } {
  const lines = errors.map(entry => {
    const fatal = entry.isFatal ? ' [fatal]' : '';
    const stack = entry.stack ? `\n    ${entry.stack.replace(/\n/g, '\n    ')}` : '';
    return `- ${entry.timestamp}${fatal} (app ${entry.appVersion}): ${entry.message}${stack}`;
  });
  const body = lines.length > 0 ? lines.join('\n') : 'No errors recorded.';
  return {
    subject: `${meta.appName} error report`,
    body: `App: ${meta.appName}\nError log (${errors.length} entries):\n\n${body}`,
  };
}

/**
 * Build the `mailto:` URL a screen can pass to `Linking.openURL` — the "Send
 * error report" path. Pure and testable; the actual screen/button lands in
 * Task 5 (Report-an-error), this is the export primitive.
 */
export function errorReportMailto(
  errors: ErrorLogEntry[],
  meta: ErrorReportMeta,
): string {
  const { subject, body } = composeErrorReport(errors, meta);
  return `mailto:${meta.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
