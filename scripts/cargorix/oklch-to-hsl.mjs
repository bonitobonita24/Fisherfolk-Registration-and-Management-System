#!/usr/bin/env node
/**
 * Cargorix Wave 0 — oklch → HSL-triplet conversion tool.
 *
 * FRMS is Tailwind v3 and consumes color tokens as bare HSL triplets via
 * `hsl(var(--x))`. The Cargorix donor template is Tailwind v4 and ships its
 * tokens as `oklch()`. Path A1 (locked, DECISIONS_LOG) stays on v3, so every
 * Cargorix value we borrow must be converted oklch → HSL ONCE, verified, and
 * checked in — never left as oklch on the v3 build (Risk Register: "Tailwind
 * v3 vs v4 mismatch").
 *
 * Pipeline: OKLCH → OKLab → linear sRGB → gamma sRGB → HSL.
 * Reference: CSS Color 4 (oklab/oklch) + sRGB companding.
 *
 * Usage:
 *   node scripts/cargorix/oklch-to-hsl.mjs            # convert the Cargorix identity token set
 *   node scripts/cargorix/oklch-to-hsl.mjs 0.841 0.238 128.85   # convert one L C H
 */

// ---- OKLCH → linear sRGB ---------------------------------------------------
function oklchToLinearSrgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab → LMS' (cube of l',m',s')
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  // LMS → linear sRGB
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [r, g, bl];
}

// ---- linear → gamma sRGB (companding) --------------------------------------
function linearToGamma(c) {
  const abs = Math.abs(c);
  const v = abs <= 0.0031308 ? 12.92 * abs : 1.055 * abs ** (1 / 2.4) - 0.055;
  return Math.sign(c) * v;
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

// ---- gamma sRGB [0..1] → HSL -----------------------------------------------
function srgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s * 100, l * 100];
}

/** Convert one oklch(L C H) → { h, s, l, triplet, gamut } */
export function oklchToHsl(L, C, H) {
  const [lr, lg, lb] = oklchToLinearSrgb(L, C, H);
  const rawR = linearToGamma(lr);
  const rawG = linearToGamma(lg);
  const rawB = linearToGamma(lb);
  const inGamut = [rawR, rawG, rawB].every((c) => c >= -0.0005 && c <= 1.0005);
  const [h, s, l] = srgbToHsl(clamp01(rawR), clamp01(rawG), clamp01(rawB));
  const round = (n, p = 1) => Number(n.toFixed(p));
  return {
    h: round(h),
    s: round(s),
    l: round(l),
    triplet: `${round(h)} ${round(s)}% ${round(l)}%`,
    gamut: inGamut ? 'in' : 'CLIPPED',
  };
}

// ---- The Cargorix identity token set (from donor globals.css) --------------
const CARGORIX = {
  light: {
    '--primary': [0.841, 0.238, 128.85],
    '--primary-foreground': [0.405, 0.101, 131.063],
    '--ring': [0.72, 0.19, 129],
    '--accent': [0.972, 0.014, 136],
    '--accent-foreground': [0.32, 0.06, 132],
    '--sidebar-primary': [0.648, 0.2, 131.684],
    '--sidebar-primary-foreground': [0.986, 0.031, 120.757],
    '--sidebar-ring': [0.723, 0.014, 214.4],
  },
  dark: {
    '--primary': [0.768, 0.233, 130.85],
    '--primary-foreground': [0.19, 0.05, 130],
    '--ring': [0.72, 0.19, 129],
    '--accent': [0.285, 0.02, 132],
    '--accent-foreground': [0.94, 0.02, 132],
    '--sidebar-primary': [0.768, 0.233, 130.85],
    '--sidebar-primary-foreground': [0.274, 0.072, 132.109],
    '--sidebar-ring': [0.56, 0.021, 213.5],
  },
};

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 3) {
    const [L, C, H] = argv.map(Number);
    const out = oklchToHsl(L, C, H);
    console.log(`oklch(${L} ${C} ${H})  ->  hsl:  ${out.triplet}   [${out.gamut} gamut]`);
    return;
  }
  for (const [mode, tokens] of Object.entries(CARGORIX)) {
    console.log(`\n### ${mode.toUpperCase()} — Cargorix green identity, mechanically converted`);
    for (const [name, [L, C, H]] of Object.entries(tokens)) {
      const out = oklchToHsl(L, C, H);
      console.log(`  ${name.padEnd(30)} oklch(${L} ${C} ${H})  ->  ${out.triplet.padEnd(20)} [${out.gamut}]`);
    }
  }
  console.log(
    '\nNOTE: these are the DONOR GREEN values as-converted. Wave-0 remap OVERWRITES every\n' +
      'green hue with FRMS orange (25 95% 53% family) per adoption-plan §4 — the converter\n' +
      'exists to translate the NEUTRAL/surface values we borrow, and to prove the math.'
  );
}

main();
