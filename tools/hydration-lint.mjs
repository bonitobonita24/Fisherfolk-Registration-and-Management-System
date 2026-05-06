#!/usr/bin/env node
// Checks for common SSR hydration mismatch patterns in Next.js App Router components

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, extname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const HYDRATION_PATTERNS = [
  {
    name: "typeof window check without useEffect",
    pattern: /typeof\s+window\s*[!=]==?\s*["']undefined["']/,
    excludeIf: /useEffect|"use client"/,
    message:
      'typeof window check found without useEffect — wrap in useEffect or add "use client" directive',
  },
  {
    name: "Date.now() in render",
    pattern: /\bDate\.now\(\)/,
    excludeIf: /useEffect|useState|"use client"/,
    message:
      "Date.now() in render path causes hydration mismatch — move to useEffect or useState initializer",
  },
  {
    name: "Math.random() in render",
    pattern: /\bMath\.random\(\)/,
    excludeIf: /useEffect|useState|"use client"/,
    message:
      "Math.random() in render path causes hydration mismatch — move to useEffect or useState",
  },
  {
    name: "localStorage/sessionStorage access in render",
    pattern: /\b(localStorage|sessionStorage)\.\w+/,
    excludeIf: /useEffect|"use client"/,
    message:
      "Browser storage access in render path — wrap in useEffect with client directive",
  },
  {
    name: "window. access without guard",
    pattern: /\bwindow\.\w+/,
    excludeIf: /useEffect|typeof\s+window|"use client"/,
    message:
      "Direct window access without guard — use useEffect or typeof window check",
  },
  {
    name: "navigator. access in render",
    pattern: /\bnavigator\.\w+/,
    excludeIf: /useEffect|"use client"/,
    message: "navigator access in render path — move to useEffect",
  },
];

function collectTsxFiles(dir) {
  const files = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = resolve(dir, entry);
      if (
        entry === "node_modules" ||
        entry === ".next" ||
        entry === ".turbo" ||
        entry === "dist"
      )
        continue;
      try {
        const stat = statSync(full);
        if (stat.isDirectory()) {
          files.push(...collectTsxFiles(full));
        } else if (extname(full) === ".tsx" || extname(full) === ".ts") {
          files.push(full);
        }
      } catch {
        continue;
      }
    }
  } catch {
    // directory not readable
  }
  return files;
}

try {
  const appsDir = resolve(ROOT, "apps");
  const packagesUiDir = resolve(ROOT, "packages/ui");

  const files = [...collectTsxFiles(appsDir), ...collectTsxFiles(packagesUiDir)];

  if (files.length === 0) {
    console.log("⚠  No .tsx/.ts files found in apps/ or packages/ui/ — skipping hydration lint");
    process.exit(0);
  }

  const warnings = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    const relativePath = filePath.replace(ROOT + "/", "");

    for (const rule of HYDRATION_PATTERNS) {
      if (rule.pattern.test(content) && !rule.excludeIf.test(content)) {
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (rule.pattern.test(lines[i])) {
            warnings.push({
              file: relativePath,
              line: i + 1,
              rule: rule.name,
              message: rule.message,
            });
          }
        }
      }
    }
  }

  if (warnings.length > 0) {
    console.error(
      `\n⚠  Hydration lint — ${warnings.length} potential mismatch(es):\n`
    );
    for (const w of warnings) {
      console.error(`  ${w.file}:${w.line}`);
      console.error(`    ${w.rule}: ${w.message}\n`);
    }
    process.exit(1);
  }

  console.log(
    `✅ Hydration lint passed — ${files.length} files checked, 0 issues`
  );
} catch (err) {
  console.error(`❌ Hydration lint error: ${err.message}`);
  process.exit(1);
}
