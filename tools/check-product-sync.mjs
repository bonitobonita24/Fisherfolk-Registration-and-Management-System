#!/usr/bin/env node
// Validates PRODUCT.md <-> inputs.yml alignment and checks for private tag leaks

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function readFile(relPath) {
  const abs = resolve(ROOT, relPath);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, "utf-8");
}

function extractPrivateContent(productMd) {
  const blocks = [];
  const regex = /<private>([\s\S]*?)<\/private>/g;
  let match;
  while ((match = regex.exec(productMd)) !== null) {
    const content = match[1].trim();
    if (content.length > 0) {
      const words = content
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .map((w) => w.toLowerCase());
      blocks.push(...words);
    }
  }
  return [...new Set(blocks)];
}

function checkPrivateLeaks(privateWords, governanceDocs) {
  const leaks = [];
  for (const { name, content } of governanceDocs) {
    if (!content) continue;
    const lower = content.toLowerCase();
    for (const word of privateWords) {
      if (lower.includes(word)) {
        leaks.push({ doc: name, word });
      }
    }
  }
  return leaks;
}

function extractRequiredSections(productMd) {
  const required = [
    "App Name",
    "Purpose",
    "Target Users",
    "Core Entities",
    "User Roles",
    "Main Workflows",
    "Data Sensitivity",
    "Tenancy Model",
    "Environments Needed",
  ];
  const missing = [];
  for (const section of required) {
    const pattern = new RegExp(`##\\s+.*${section.replace(/\s+/g, "\\s+")}`, "i");
    if (!pattern.test(productMd)) {
      missing.push(section);
    }
  }
  return missing;
}

try {
  const errors = [];

  const productMd = readFile("docs/PRODUCT.md");
  if (!productMd) {
    console.error("❌ docs/PRODUCT.md not found");
    process.exit(1);
  }

  const inputsYml = readFile("inputs.yml");
  if (!inputsYml) {
    console.error("❌ inputs.yml not found");
    process.exit(1);
  }

  const missingSections = extractRequiredSections(productMd);
  if (missingSections.length > 0) {
    for (const s of missingSections) {
      errors.push(`PRODUCT.md missing required section: ${s}`);
    }
  }

  const privateWords = extractPrivateContent(productMd);
  if (privateWords.length > 0) {
    const governanceDocs = [
      { name: "docs/CHANGELOG_AI.md", content: readFile("docs/CHANGELOG_AI.md") },
      { name: "docs/DECISIONS_LOG.md", content: readFile("docs/DECISIONS_LOG.md") },
      { name: "docs/IMPLEMENTATION_MAP.md", content: readFile("docs/IMPLEMENTATION_MAP.md") },
      { name: ".cline/memory/agent-log.md", content: readFile(".cline/memory/agent-log.md") },
      { name: ".cline/memory/lessons.md", content: readFile(".cline/memory/lessons.md") },
    ];

    const leaks = checkPrivateLeaks(privateWords, governanceDocs);
    for (const leak of leaks) {
      errors.push(`Private content leaked: word "${leak.word}" found in ${leak.doc}`);
    }
  }

  const entityPattern = /##\s+.*Core\s+Entities([\s\S]*?)(?=\n##\s|\n---|\Z)/i;
  const entityMatch = productMd.match(entityPattern);
  if (entityMatch) {
    const entitySection = entityMatch[1];
    const entityNames = [];
    const lines = entitySection.split("\n");
    for (const line of lines) {
      const m = line.match(/^\s*[-*]\s+\*?\*?(\w+)\*?\*?\s*[—–:-]/);
      if (m) entityNames.push(m[1].toLowerCase());

      const m2 = line.match(/^###\s+(\w+)/);
      if (m2) entityNames.push(m2[1].toLowerCase());
    }

    if (entityNames.length > 0) {
      const inputsLower = inputsYml.toLowerCase();
      for (const entity of entityNames) {
        if (entity.length > 3 && !inputsLower.includes(entity)) {
          errors.push(`Entity "${entity}" declared in PRODUCT.md but not found in inputs.yml`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ Product sync check failed — ${errors.length} error(s):\n`);
    for (const err of errors) {
      console.error(`  • ${err}`);
    }
    process.exit(1);
  }

  console.log("✅ Product sync check passed — PRODUCT.md and inputs.yml are aligned");
} catch (err) {
  console.error(`❌ Sync check error: ${err.message}`);
  process.exit(1);
}
