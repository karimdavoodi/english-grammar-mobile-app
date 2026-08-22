/**
 * Tests for the content loader's load-time validation (Task 13).
 *
 * content/index.ts validates the assembled corpus at module import — the
 * fail-fast safety net: a malformed track throws the moment the loader loads,
 * before it can reach the app. `jest.doMock` + `jest.resetModules` swap in a
 * malformed `tracks/basic` so the throw is provable without touching the real
 * (valid) corpus.
 */

describe('content loader — load-time validation', () => {
  afterEach(() => {
    jest.dontMock('../tracks/basic');
    jest.resetModules();
  });

  it('imports the validated corpus without error (valid content passes)', () => {
    jest.resetModules();
    expect(() => require('../index')).not.toThrow();
  });

  it('throws at load when the bundled corpus is malformed (fail-fast)', () => {
    // An eligible starting-point track with no level 1 violates the schema.
    jest.doMock('../tracks/basic', () => ({
      basicTrack: {
        id: 'basic',
        order: 1,
        name: 'basic',
        label: 'Basic',
        eligibleStartingPoint: true,
        levels: [],
      },
    }));
    jest.resetModules();
    expect(() => require('../index')).toThrow(/Content validation failed/);
  });
});
