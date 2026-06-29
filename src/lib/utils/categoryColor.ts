// src/lib/utils/categoryColor.ts

/**
 * Converts a hex color string to RGB components [0–255].
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/**
 * Converts a linear RGB channel value to relative luminance component.
 * Per WCAG 2.1 spec.
 */
function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Returns the relative luminance of a hex color (0 = black, 1 = white).
 */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Returns the WCAG contrast ratio between two hex colors.
 * Range: 1 (identical) to 21 (black on white).
 * WCAG AA requires >= 4.5 for normal text.
 */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Darkens a hex color by reducing each RGB channel by `amount` (0–1).
 * Used to push low-luminance colors to a readable contrast on light backgrounds.
 */
function darkenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const d = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  return (
    '#' +
    [d(r), d(g), d(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Returns the effective text color for a category pill in the current theme.
 *
 * In dark theme: returns the original hex (already readable on dark surface).
 * In light theme: if the color's contrast ratio against white (#ffffff) is
 * below WCAG AA (4.5), darkens the color iteratively until it passes.
 * Max 6 iterations (each step darkens by 15%).
 */
export function getEffectiveColor(hex: string, isDark: boolean): string {
  if (isDark) return hex;

  const WHITE = '#ffffff';
  const TARGET_RATIO = 4.5;
  const STEP = 0.15;
  const MAX_ITER = 6;

  let color = hex;
  for (let i = 0; i < MAX_ITER; i++) {
    if (contrastRatio(color, WHITE) >= TARGET_RATIO) break;
    color = darkenHex(color, STEP);
  }
  return color;
}

/**
 * Returns the full style object for a category pill.
 *
 * Dark theme:  pill bg = color at 12% opacity  (existing behaviour)
 * Light theme: pill bg = color at 14% opacity, text uses contrast-safe color
 *
 * Usage:
 *   const styles = getCategoryPillStyles(cat.color, isDark);
 *   <span style={styles.pill}>
 *     <span style={styles.dot} />
 *     {cat.name}
 *   </span>
 */
export function getCategoryPillStyles(
  hex: string,
  isDark: boolean
): {
  pill: React.CSSProperties;
  dot: React.CSSProperties;
} {
  const effectiveColor = getEffectiveColor(hex, isDark);
  const bgOpacity = isDark ? '1f' : '24'; // ~12% dark / ~14% light

  return {
    pill: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '999px',
      backgroundColor: `${effectiveColor}${bgOpacity}`,
      color: effectiveColor,
      fontSize: '0.8rem',
      fontWeight: 600,
    },
    dot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: effectiveColor,
      display: 'inline-block',
      flexShrink: 0,
    },
  };
}

/**
 * Hook-free helper: reads current theme from the html data-theme attribute.
 * Safe to call in client components — returns 'dark' on SSR (no document).
 */
export function getIsDark(): boolean {
  if (typeof document === 'undefined') return true;
  return document.documentElement.getAttribute('data-theme') !== 'light';
}
