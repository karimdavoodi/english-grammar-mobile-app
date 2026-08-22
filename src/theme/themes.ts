/**
 * Light and dark color palettes.
 *
 * A single semantic `ThemeColors` palette drives every screen and component —
 * no hardcoded hex anywhere in the UI. The light palette keeps the exact colors
 * the app shipped with (a gray/slate base, blue primary, green success, red
 * danger, orange warning); the dark palette is a darker slate scheme with
 * brighter accents tuned for contrast on dark surfaces.
 *
 * Consumed via `useTheme()` (ThemeProvider) — screens build their styles from
 * `colors`, so both schemes stay in sync automatically.
 */

export interface ThemeColors {
  // ── Surfaces ────────────────────────────────────────────────────
  /** Screen background. */
  background: string;
  /** Cards, rows, buttons. */
  surface: string;
  /** Muted panels (locked rows, empty states). */
  surfaceMuted: string;
  /** Pressed-in feedback on neutral surfaces. */
  surfacePressed: string;
  /** Disabled surface. */
  surfaceDisabled: string;
  /** Strong neutral border (buttons, chips). */
  surfaceBorder: string;

  // ── Text ─────────────────────────────────────────────────────────
  /** Strongest text (headings, prompts). */
  textPrimary: string;
  /** Secondary text (stat labels, explanations). */
  textSecondary: string;
  /** Body-level tertiary text (answers, meta). */
  textTertiary: string;
  /** Muted text (captions, hints). */
  textMuted: string;
  /** Disabled/locked text. */
  textDisabled: string;
  /** Text on accent-filled buttons (primary/success/warning). */
  textOnAccent: string;
  /** Muted text on accent-filled buttons (secondary label). */
  textOnAccentMuted: string;

  // ── Borders ──────────────────────────────────────────────────────
  /** Default divider/border. */
  border: string;
  /** Stronger border (interactive controls). */
  borderStrong: string;
  /** Hairline/subtle divider. */
  borderSubtle: string;

  // ── Primary (blue) ───────────────────────────────────────────────
  /** Accent fill (buttons, current markers). */
  primary: string;
  /** Pressed accent fill. */
  primaryPressed: string;
  /** Tinted accent container (headers, selected states). */
  primaryContainer: string;
  /** Border for the accent container. */
  primaryBorder: string;
  /** Strong text on the accent container. */
  primaryOnContainer: string;
  /** Muted text on the accent container. */
  primaryOnContainerMuted: string;

  // ── Success (green) ──────────────────────────────────────────────
  /** Success fill (pass buttons, correct borders). */
  success: string;
  /** Pressed success fill. */
  successPressed: string;
  /** Tinted success container (result card, correct choice). */
  successContainer: string;
  /** Border for the success container. */
  successBorder: string;
  /** Text on the success container. */
  successOnContainer: string;
  /** Strong text on the success container. */
  successOnContainerStrong: string;
  /** Success badge background. */
  successBadge: string;

  // ── Danger (red) ─────────────────────────────────────────────────
  /** Danger border/marker (wrong choice). */
  danger: string;
  /** Pressed danger fill (destructive action). */
  dangerPressed: string;
  /** Danger text (why-a-choice-is-wrong). */
  dangerText: string;
  /** Tinted danger container (wrong choice background). */
  dangerContainer: string;

  // ── Warning (amber/orange) — lesson card, badges ─────────────────
  /** Warning fill (lesson continue button). */
  warning: string;
  /** Pressed warning fill. */
  warningPressed: string;
  /** Tinted warning container (lesson card). */
  warningContainer: string;
  /** Border for the warning container. */
  warningBorder: string;
  /** Text on the warning container. */
  warningOnContainer: string;
  /** Strong text on the warning container. */
  warningOnContainerStrong: string;
  /** Kicker/example text on the warning container. */
  warningKicker: string;
  /** Badge background (Weakness Queue, needs-review). */
  warningBadge: string;
  /** Badge text. */
  warningBadgeText: string;
  /** Standalone warning text (save warning, miss count). */
  warningText: string;

  // ── Badge chips (number/letter circles) ──────────────────────────
  /** Number/letter circle background. */
  badgeSurface: string;
  /** Number/letter circle text. */
  badgeText: string;
}

/** Light palette — the exact colors the app shipped with. */
export const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f9fafb',
  surfacePressed: '#f3f4f6',
  surfaceDisabled: '#f9fafb',
  surfaceBorder: '#d1d5db',

  textPrimary: '#111827',
  textSecondary: '#374151',
  textTertiary: '#4b5563',
  textMuted: '#6b7280',
  textDisabled: '#9ca3af',
  textOnAccent: '#ffffff',
  textOnAccentMuted: '#dbeafe',

  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  borderSubtle: '#f3f4f6',

  primary: '#2563eb',
  primaryPressed: '#1d4ed8',
  primaryContainer: '#eff6ff',
  primaryBorder: '#bfdbfe',
  primaryOnContainer: '#1e3a8a',
  primaryOnContainerMuted: '#1e40af',

  success: '#16a34a',
  successPressed: '#15803d',
  successContainer: '#f0fdf4',
  successBorder: '#bbf7d0',
  successOnContainer: '#166534',
  successOnContainerStrong: '#14532d',
  successBadge: '#dcfce7',

  danger: '#dc2626',
  dangerPressed: '#b91c1c',
  dangerText: '#b91c1c',
  dangerContainer: '#fef2f2',

  warning: '#ea580c',
  warningPressed: '#c2410c',
  warningContainer: '#fff7ed',
  warningBorder: '#fed7aa',
  warningOnContainer: '#7c2d12',
  warningOnContainerStrong: '#431407',
  warningKicker: '#9a3412',
  warningBadge: '#fef3c7',
  warningBadgeText: '#92400e',
  warningText: '#b45309',

  badgeSurface: '#e5e7eb',
  badgeText: '#4b5563',
};

/** Dark palette — a slate scheme with brighter accents for dark surfaces. */
export const darkColors: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceMuted: '#111827',
  surfacePressed: '#334155',
  surfaceDisabled: '#1a2233',
  surfaceBorder: '#475569',

  textPrimary: '#f8fafc',
  textSecondary: '#e2e8f0',
  textTertiary: '#cbd5e1',
  textMuted: '#94a3b8',
  textDisabled: '#64748b',
  textOnAccent: '#ffffff',
  textOnAccentMuted: '#bfdbfe',

  border: '#334155',
  borderStrong: '#475569',
  borderSubtle: '#1f2937',

  primary: '#3b82f6',
  primaryPressed: '#2563eb',
  primaryContainer: '#1e3a5f',
  primaryBorder: '#1e3a8a',
  primaryOnContainer: '#93c5fd',
  primaryOnContainerMuted: '#bfdbfe',

  success: '#22c55e',
  successPressed: '#16a34a',
  successContainer: '#0f2e1d',
  successBorder: '#166534',
  successOnContainer: '#86efac',
  successOnContainerStrong: '#bbf7d0',
  successBadge: '#14532d',

  danger: '#ef4444',
  dangerPressed: '#dc2626',
  dangerText: '#f87171',
  dangerContainer: '#3f1d1d',

  warning: '#fb923c',
  warningPressed: '#f97316',
  warningContainer: '#3d2b12',
  warningBorder: '#7c2d12',
  warningOnContainer: '#fdba74',
  warningOnContainerStrong: '#fed7aa',
  warningKicker: '#fb923c',
  warningBadge: '#3d2b12',
  warningBadgeText: '#fdba74',
  warningText: '#fbbf24',

  badgeSurface: '#334155',
  badgeText: '#cbd5e1',
};
