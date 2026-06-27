/**
 * Pure color utilities — no runtime dependencies.
 *
 * Inline assertions (expected outputs):
 *   hexToHslTriplet("#E8843C")  => "25 79% 57%"
 *   readableForeground("#E8843C") => "20 14% 10%"   (luminance ≈ 0.34 > 0.179 → near-black)
 *   readableForeground("#336F92") => "0 0% 100%"    (luminance ≈ 0.14 < 0.179 → white)
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Parse a "#RRGGBB" or "#RGB" hex string. Returns null if invalid. */
function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.replace(/^#/, "");
  if (raw.length === 3) {
    const r = parseInt(raw[0]! + raw[0]!, 16);
    const g = parseInt(raw[1]! + raw[1]!, 16);
    const b = parseInt(raw[2]! + raw[2]!, 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }
  if (raw.length === 6) {
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }
  return null;
}

/** Standard RGB → HSL. Returns [H(0-360), S(0-100), L(0-100)] as integers. */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) {
    // achromatic
    return [0, 0, Math.round(l * 100)];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === rn) {
    h = (gn - bn) / d + (gn < bn ? 6 : 0);
  } else if (max === gn) {
    h = (bn - rn) / d + 2;
  } else {
    h = (rn - gn) / d + 4;
  }
  h /= 6;

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * WCAG relative luminance of a single linearized channel value (0-255).
 * Threshold per IEC 61966-2-1: v/255 > 0.03928 → sRGB linearization.
 */
function linearize(channel: number): number {
  const v = channel / 255;
  return v > 0.03928 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
}

/** WCAG relative luminance (0-1) for an RGB triple. */
function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a "#RRGGBB" (or "#RGB") hex color to a Tailwind HSL triplet string
 * of the form "H S% L%" (integer values, space-separated).
 *
 * Consumed via: hsl(var(--token))
 *
 * Falls back to tangerine default "25 79% 57%" on invalid input.
 *
 * @example hexToHslTriplet("#E8843C") // => "25 79% 57%"
 */
export function hexToHslTriplet(hex: string): string {
  const FALLBACK = "25 79% 57%";
  const rgb = parseHex(hex);
  if (!rgb) return FALLBACK;
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  return `${h} ${s}% ${l}%`;
}

/**
 * Pick a readable foreground HSL triplet for text/icons placed ON top of the
 * given hex background color, using WCAG relative luminance.
 *
 * Threshold: luminance > 0.179 → near-black "20 14% 10%", else white "0 0% 100%".
 *
 * Falls back to white "0 0% 100%" on invalid input.
 *
 * @example readableForeground("#E8843C") // => "20 14% 10%"  (luminance ≈ 0.34)
 * @example readableForeground("#336F92") // => "0 0% 100%"   (luminance ≈ 0.14)
 */
export function readableForeground(hex: string): string {
  const NEAR_BLACK = "20 14% 10%";
  const WHITE = "0 0% 100%";
  const FALLBACK = WHITE;

  const rgb = parseHex(hex);
  if (!rgb) return FALLBACK;

  const lum = relativeLuminance(rgb[0], rgb[1], rgb[2]);
  return lum > 0.179 ? NEAR_BLACK : WHITE;
}
