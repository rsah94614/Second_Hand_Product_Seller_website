/**
 * Centralized design tokens for Campus Mitra.
 * Use these everywhere instead of hardcoded hex values.
 * This ensures a single-source-of-truth for all theming.
 */

export const palette = {
  // Slate scale
  slate50:  "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  slate900: "#0f172a",
  slate950: "#020617",

  // Primary (Indigo)
  primary50:  "#eef2ff",
  primary100: "#e0e7ff",
  primary200: "#c7d2fe",
  primary300: "#a5b4fc",
  primary400: "#818cf8",
  primary500: "#6366f1",
  primary600: "#4f46e5",
  primary700: "#4338ca",
  primary800: "#3730a3",
  primary900: "#312e81",
  primary950: "#1e1b4b",
} as const;

/** Semantic tokens — use isDark to pick the right value */
export const tokens = {
  bg: {
    light: palette.slate50,   // page background
    dark:  palette.slate950,
  },
  surface: {
    light: "#ffffff",          // card / panel surface
    dark:  palette.slate900,
  },
  surfaceAlt: {
    light: palette.slate50,    // subtle alternate surface
    dark:  palette.slate950,
  },
  border: {
    light: palette.slate100,
    dark:  palette.slate800,
  },
  text: {
    primary: {
      light: palette.slate900,
      dark:  "#ffffff",
    },
    secondary: {
      light: palette.slate500,
      dark:  palette.slate400,
    },
    muted: {
      light: palette.slate400,
      dark:  palette.slate500,
    },
  },
  header: {
    bg: {
      light: "#ffffff",
      dark:  palette.slate900,
    },
    tint: {
      light: palette.slate800,
      dark:  "#ffffff",
    },
  },
  tabBar: {
    bg: {
      light: "#ffffff",
      dark:  palette.slate900,
    },
    border: {
      light: palette.slate100,
      dark:  palette.slate800,
    },
    active:   palette.primary500,
    inactive: {
      light: palette.slate400,
      dark:  palette.slate500,
    },
  },
} as const;

/** Returns the correct token value based on the current color scheme */
export function t<T extends { light: string; dark: string }>(
  token: T,
  isDark: boolean
): string {
  return isDark ? token.dark : token.light;
}
