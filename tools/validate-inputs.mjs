#!/usr/bin/env node
// Validates inputs.yml against inputs.schema.json

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function loadYaml(path) {
  const text = readFileSync(path, "utf-8");
  try {
    const lines = text.split("\n");
    const result = {};
    let currentSection = result;
    let currentKey = null;
    const stack = [{ obj: result, indent: -1 }];

    for (const line of lines) {
      if (line.trim() === "" || line.trim().startsWith("#")) continue;

      const indent = line.search(/\S/);
      const content = line.trim();

      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }
      currentSection = stack[stack.length - 1].obj;

      if (content.startsWith("- ")) {
        const val = content.slice(2).trim();
        if (Array.isArray(currentSection)) {
          currentSection.push(parseValue(val));
        } else if (currentKey && currentSection[currentKey]) {
          if (!Array.isArray(currentSection[currentKey])) {
            currentSection[currentKey] = [];
          }
          currentSection[currentKey].push(parseValue(val));
        }
        continue;
      }

      const colonIdx = content.indexOf(":");
      if (colonIdx === -1) continue;

      const key = content.slice(0, colonIdx).trim();
      const rawVal = content.slice(colonIdx + 1).trim();

      if (rawVal === "" || rawVal === "|") {
        currentSection[key] = {};
        currentKey = key;
        stack.push({ obj: currentSection[key], indent });
      } else {
        currentSection[key] = parseValue(rawVal);
        currentKey = key;
      }
    }
    return result;
  } catch {
    console.error("Failed to parse inputs.yml — ensure valid YAML syntax");
    process.exit(1);
  }
}

function parseValue(val) {
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "null" || val === "~") return null;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}

try {
  const inputsPath = resolve(ROOT, "inputs.yml");
  const schemaPath = resolve(ROOT, "inputs.schema.json");

  readFileSync(inputsPath, "utf-8");
  const schema = loadJson(schemaPath);
  const inputs = loadYaml(inputsPath);

  const errors = [];

  const requiredTopLevel = schema.required || [];
  for (const key of requiredTopLevel) {
    if (!(key in inputs)) {
      errors.push(`Missing required top-level key: ${key}`);
    }
  }

  if (inputs.app) {
    if (!inputs.app.name) errors.push("app.name is required");
    if (!inputs.app.slug) errors.push("app.slug is required");
  }

  if (inputs.ports?.dev) {
    const devPorts = inputs.ports.dev;
    const portValues = Object.values(devPorts).filter((v) => typeof v === "number");
    const uniquePorts = new Set(portValues);
    if (uniquePorts.size !== portValues.length) {
      errors.push("Duplicate port values detected in ports.dev — each service must have a unique port");
    }
  }

  if (inputs.docker?.publish) {
    if (!inputs.docker.hub_repo) errors.push("docker.hub_repo is required when docker.publish is true");
    if (!inputs.docker.image_name) errors.push("docker.image_name is required when docker.publish is true");
  }

  if (errors.length > 0) {
    console.error(`\n❌ inputs.yml validation failed — ${errors.length} error(s):\n`);
    for (const err of errors) {
      console.error(`  • ${err}`);
    }
    process.exit(1);
  }

  console.log("✅ inputs.yml validation passed");
} catch (err) {
  console.error(`❌ Validation error: ${err.message}`);
  process.exit(1);
}
