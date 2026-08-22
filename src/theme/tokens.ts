/**
 * Design tokens — the scheme-independent structural constants: spacing,
 * typography sizes, and radii. The color half of the theme system lives in
 * `themes.ts`; this module is the structure half, exposed on the Theme value so
 * screens can build consistent spacing/type/radii without magic numbers.
 *
 * Task 12 ships the theme system; screens primarily consume the semantic color
 * palette (`useTheme().colors`), and new UI (SettingsScreen) builds on these
 * tokens.
 */
export const tokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  typography: {
    caption: 12,
    small: 13,
    body: 14,
    bodyLarge: 16,
    title: 20,
    heading: 26,
  },
  radii: {
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
    pill: 17,
  },
} as const;
