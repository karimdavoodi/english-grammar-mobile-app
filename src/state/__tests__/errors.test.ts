/**
 * Tests for the local error log (`errors.ts`) — the no-third-party crash
 * capture from Task 3. Storage functions are injectable, so every test runs
 * against an in-memory Map-backed store; the real AsyncStorage module is
 * jest-mocked so the top-level `DEFAULT_STORE` import resolves in Node.
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
  clearErrors,
  composeErrorReport,
  ERROR_LOG_CAP,
  errorReportMailto,
  ERRORS_KEY,
  loadErrors,
  recordError,
  type ErrorLogEntry,
} from '../errors';
import type { StorageLike } from '../storage';

/** In-memory AsyncStorage-compatible store for tests. */
function createMemoryStore(initial: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initial));
  return {
    async getItem(key) {
      return data.get(key) ?? null;
    },
    async setItem(key, value) {
      data.set(key, value);
    },
    async removeItem(key) {
      data.delete(key);
    },
  };
}

function makeEntry(
  overrides: Partial<Omit<ErrorLogEntry, 'id'>> = {},
): Omit<ErrorLogEntry, 'id'> {
  return {
    message: 'Boom',
    timestamp: '2026-08-22T10:00:00.000Z',
    appVersion: '1.0.0',
    isFatal: false,
    ...overrides,
  };
}

describe('loadErrors', () => {
  it('returns an empty log when nothing is stored', async () => {
    const store = createMemoryStore();
    expect(await loadErrors(store)).toEqual([]);
  });

  it('returns an empty log on malformed JSON (capture must never throw)', async () => {
    const store = createMemoryStore({ [ERRORS_KEY]: 'not-json{' });
    expect(await loadErrors(store)).toEqual([]);
  });

  it('returns an empty log when the stored value is not an array', async () => {
    const store = createMemoryStore({ [ERRORS_KEY]: '{"message":"boom"}' });
    expect(await loadErrors(store)).toEqual([]);
  });

  it('reads back entries written by recordError', async () => {
    const store = createMemoryStore();
    await recordError(makeEntry({ message: 'First' }), store);
    await recordError(makeEntry({ message: 'Second', isFatal: true }), store);

    const log = await loadErrors(store);
    expect(log).toHaveLength(2);
    expect(log[0].message).toBe('First');
    expect(log[1].message).toBe('Second');
    expect(log[1].isFatal).toBe(true);
  });
});

describe('recordError', () => {
  it('persists the entry under egg:errors with an assigned id', async () => {
    const store = createMemoryStore();
    const entry = await recordError(makeEntry(), store);

    expect(typeof entry.id).toBe('string');
    expect(entry.id.length).toBeGreaterThan(0);
    const stored = JSON.parse((await store.getItem(ERRORS_KEY)) ?? '');
    expect(stored).toHaveLength(1);
    expect(stored[0].message).toBe('Boom');
    expect(stored[0].id).toBe(entry.id);
  });

  it('drops the oldest entries past the cap', async () => {
    const store = createMemoryStore();
    for (let i = 0; i < ERROR_LOG_CAP + 5; i += 1) {
      await recordError(makeEntry({ message: `err-${i}` }), store);
    }

    const log = await loadErrors(store);
    expect(log).toHaveLength(ERROR_LOG_CAP);
    // The first five were dropped; the newest five survive.
    expect(log[0].message).toBe(`err-${5}`);
    expect(log[log.length - 1].message).toBe(`err-${ERROR_LOG_CAP + 4}`);
  });
});

describe('clearErrors', () => {
  it('empties the log after a successful export', async () => {
    const store = createMemoryStore();
    await recordError(makeEntry(), store);
    await clearErrors(store);

    expect(await loadErrors(store)).toEqual([]);
    expect(await store.getItem(ERRORS_KEY)).toBeNull();
  });
});

describe('composeErrorReport', () => {
  it('builds a subject and body from the log', () => {
    const errors: ErrorLogEntry[] = [
      {
        id: '1',
        message: 'Something broke',
        stack: 'line1\nline2',
        timestamp: '2026-08-22T10:00:00.000Z',
        appVersion: '1.0.0',
        isFatal: true,
      },
      {
        id: '2',
        message: 'Soft failure',
        timestamp: '2026-08-22T10:01:00.000Z',
        appVersion: '1.0.0',
        isFatal: false,
      },
    ];

    const { subject, body } = composeErrorReport(errors, {
      appName: 'English Grammar Game',
      to: 'support@example.com',
    });

    expect(subject).toBe('English Grammar Game error report');
    expect(body).toContain('App: English Grammar Game');
    expect(body).toContain('2 entries');
    expect(body).toContain('[fatal]');
    expect(body).toContain('Something broke');
    expect(body).toContain('line1\n    line2');
    expect(body).toContain('Soft failure');
  });

  it('handles an empty log', () => {
    const { body } = composeErrorReport([], {
      appName: 'English Grammar Game',
      to: 'support@example.com',
    });
    expect(body).toContain('No errors recorded.');
  });
});

describe('errorReportMailto', () => {
  it('builds an encoded mailto URL with subject and body', () => {
    const errors: ErrorLogEntry[] = [
      {
        id: '1',
        message: 'A & B broke',
        timestamp: '2026-08-22T10:00:00.000Z',
        appVersion: '1.0.0',
        isFatal: false,
      },
    ];

    const url = errorReportMailto(errors, {
      appName: 'English Grammar Game',
      to: 'support@example.com',
    });

    expect(url).toMatch(/^mailto:support@example\.com\?/);
    expect(url).toContain('subject=');
    expect(url).toContain('body=');
    expect(decodeURIComponent(url)).toContain('A & B broke');
  });
});
