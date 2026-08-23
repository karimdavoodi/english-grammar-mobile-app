/**
 * Global JS error capture — the local-first half of Task 3's crash visibility.
 *
 * Installs a `global.ErrorUtils` handler (React Native's fatal/non-fatal JS
 * error sink) that appends every uncaught error to the local `egg:errors` log
 * (src/state/errors.ts) and chains the previous handler so the platform's own
 * logging/red-box behavior still runs. The errors are then reachable by the
 * developer and exportable as a mailto (see docs/release.md).
 *
 * The handler's dependencies are injectable so tests run without the native
 * AsyncStorage module or the ErrorUtils global. In the app it is installed once
 * from index.js, before the root component registers, so startup and
 * render-time crashes surface too.
 */

import { recordError, type ErrorLogEntry } from '../state/errors';
import { version as appVersion } from '../../app.json';

/** React Native's global fatal/non-fatal JS error handler shape. */
export type GlobalErrorHandler = (error: unknown, isFatal?: boolean) => void;

/** The slice of the ErrorUtils global this module depends on. */
export interface ErrorUtilsGlobal {
  setGlobalHandler?: (handler: GlobalErrorHandler) => void;
  getGlobalHandler?: () => GlobalErrorHandler | undefined;
}

export interface ErrorReportingOptions {
  /** Persist an entry. Defaults to the AsyncStorage-backed egg:errors log. */
  record?: (entry: Omit<ErrorLogEntry, 'id'>) => void | Promise<void>;
  /** Read the current ErrorUtils handler (injectable for tests). */
  getGlobalHandler?: () => GlobalErrorHandler | undefined;
  /** Replace the ErrorUtils handler (injectable for tests). */
  setGlobalHandler?: (handler: GlobalErrorHandler) => void;
  /** Timestamp source — injectable for deterministic tests. */
  now?: () => string;
}

function defaultGetGlobalHandler(): GlobalErrorHandler | undefined {
  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsGlobal }).ErrorUtils;
  return errorUtils?.getGlobalHandler?.();
}

function defaultSetGlobalHandler(handler: GlobalErrorHandler): void {
  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsGlobal }).ErrorUtils;
  errorUtils?.setGlobalHandler?.(handler);
}

/**
 * Install the capture handler. Returns an uninstall function that restores the
 * previous handler (useful for tests and hot-reload teardown).
 */
export function installErrorReporting(options: ErrorReportingOptions = {}): () => void {
  const {
    record = entry => {
      recordError(entry).catch(() => {
        // Persistence can fail (e.g. storage full); capture must not crash.
      });
    },
    getGlobalHandler = defaultGetGlobalHandler,
    setGlobalHandler = defaultSetGlobalHandler,
    now = () => new Date().toISOString(),
  } = options;

  const previous = getGlobalHandler();

  const handler: GlobalErrorHandler = (error, isFatal = false) => {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    try {
      // `record` may throw synchronously (injected mocks) or reject (async
      // storage) — neither may crash the app that just crashed.
      Promise.resolve(record({ message, stack, timestamp: now(), appVersion, isFatal })).catch(
        () => {},
      );
    } catch {
      // Error capture must never crash the app that just crashed.
    }
    // Chain the previous handler so the default dev red-box / log behavior and
    // any earlier-installed handlers still run.
    if (typeof previous === 'function') {
      previous(error, isFatal);
    }
  };

  setGlobalHandler(handler);

  return () => {
    if (typeof previous === 'function') {
      setGlobalHandler(previous);
    }
  };
}
