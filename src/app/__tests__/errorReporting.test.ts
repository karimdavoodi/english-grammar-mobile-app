/**
 * Tests for the global ErrorUtils hook (`errorReporting.ts`) from Task 3.
 *
 * Every dependency is injected (record, handler get/set, timestamp), so the
 * tests need no native module and no global — they assert the contract:
 * an uncaught error is recorded, the previous handler is chained, non-Error
 * values are stringified, and uninstall restores the previous handler.
 * The AsyncStorage module is jest-mocked so the top-level `recordError`
 * default import resolves in Node (the injected `record` is used instead).
 */

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (key: string) => store.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: async (key: string) => {
        store.delete(key);
      },
      clear: async () => {
        store.clear();
      },
    },
  };
});

import {
  installErrorReporting,
  type GlobalErrorHandler,
} from '../errorReporting';
import type { ErrorLogEntry } from '../../state/errors';

interface Harness {
  recorded: Array<Omit<ErrorLogEntry, 'id'>>;
  /** Install options with every dependency injected. */
  harness: {
    record: (entry: Omit<ErrorLogEntry, 'id'>) => void | Promise<void>;
    getGlobalHandler: () => GlobalErrorHandler | undefined;
    setGlobalHandler: (handler: GlobalErrorHandler) => void;
    now: () => string;
  };
  currentHandler: () => GlobalErrorHandler | undefined;
  setHandler: (handler: GlobalErrorHandler | undefined) => void;
}

function makeHarness(): Harness {
  let current: GlobalErrorHandler | undefined;
  const recorded: Array<Omit<ErrorLogEntry, 'id'>> = [];
  return {
    recorded,
    harness: {
      record: async (entry: Omit<ErrorLogEntry, 'id'>) => {
        recorded.push(entry);
      },
      getGlobalHandler: () => current,
      setGlobalHandler: (handler: GlobalErrorHandler) => {
        current = handler;
      },
      now: () => '2026-08-22T10:00:00.000Z',
    },
    currentHandler: () => current,
    setHandler: (handler: GlobalErrorHandler | undefined) => {
      current = handler;
    },
  };
}

describe('installErrorReporting', () => {
  it('replaces the global handler and records uncaught errors', () => {
    const h = makeHarness();

    installErrorReporting(h.harness);

    const installed = h.currentHandler();
    expect(installed).toBeDefined();

    installed!(new Error('Kaboom'), true);

    expect(h.recorded).toHaveLength(1);
    expect(h.recorded[0]).toMatchObject({
      message: 'Kaboom',
      appVersion: '2.0.0',
      isFatal: true,
      timestamp: '2026-08-22T10:00:00.000Z',
    });
    expect(h.recorded[0].stack).toContain('Error: Kaboom');
  });

  it('chains the previous handler so platform logging still runs', () => {
    const calls: Array<[unknown, boolean | undefined]> = [];
    const previous: GlobalErrorHandler = (error, isFatal) => {
      calls.push([error, isFatal]);
    };
    const h = makeHarness();
    h.setHandler(previous);

    installErrorReporting(h.harness);
    h.currentHandler()!(new Error('Boom'), false);

    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBeInstanceOf(Error);
    expect(calls[0][1]).toBe(false);
  });

  it('stringifies non-Error values (strings, objects, null)', () => {
    const h = makeHarness();

    installErrorReporting(h.harness);

    h.currentHandler()!('a plain string', false);
    h.currentHandler()!(null, false);
    h.currentHandler()!({ code: 42 }, false);

    expect(h.recorded.map(r => r.message)).toEqual([
      'a plain string',
      'null',
      '[object Object]',
    ]);
    expect(h.recorded.every(r => r.stack === undefined)).toBe(true);
  });

  it('records the error even when persistence throws (capture must not crash)', () => {
    const h = makeHarness();
    h.harness.record = () => {
      throw new Error('storage is broken');
    };

    // Neither installing nor invoking the handler may throw.
    expect(() => installErrorReporting(h.harness)).not.toThrow();
    expect(() => h.currentHandler()!(new Error('Boom'), false)).not.toThrow();
  });

  it('restores the previous handler on uninstall', () => {
    const h = makeHarness();
    const previous: GlobalErrorHandler = () => {};
    h.setHandler(previous);

    const uninstall = installErrorReporting(h.harness);
    expect(h.currentHandler()).not.toBe(previous);

    uninstall();
    expect(h.currentHandler()).toBe(previous);
  });
});
