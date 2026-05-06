#!/usr/bin/env node
// Validates that all required environment variables are set in .env files

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const REQUIRED_VARS = [
  "COMPOSE_PROJECT_NAME",
  "APP_ENV",
  "APP_PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "DATABASE_URL",
  "PGBOUNCER_PORT",
  "PGBOUNCER_AUTH_PASSWORD",
  "REDIS_HOST",
  "REDIS_PORT",
  "REDIS_PASSWORD",
  "REDIS_URL",
  "STORAGE_ENDPOINT",
  "STORAGE_BUCKET",
  "STORAGE_ACCESS_KEY",
  "STORAGE_SECRET_KEY",
  "AUTH_SECRET",
  "NEXTAUTH_URL",
  "PGADMIN_PORT",
  "PGADMIN_EMAIL",
  "PGADMIN_PASSWORD",
];

const STAGING_PROD_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_FROM",
  "TRAEFIK_NETWORK",
  "APP_DOMAIN",
  "DOCKERHUB_USERNAME",
  "IMAGE_NAME",
  "APP_IMAGE_TAG",
];

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, "utf-8");
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    vars[key] = val;
  }
  return vars;
}

const envFiles = [".env.dev", ".env.staging", ".env.prod"];
let totalErrors = 0;

for (const envFile of envFiles) {
  const filePath = resolve(ROOT, envFile);
  const vars = parseEnvFile(filePath);

  if (!vars) {
    console.warn(`⚠  ${envFile} not found — skipping`);
    continue;
  }

  const errors = [];
  const isDevEnv = envFile === ".env.dev";
  const requiredForEnv = isDevEnv ? REQUIRED_VARS : [...REQUIRED_VARS, ...STAGING_PROD_VARS];

  for (const key of requiredForEnv) {
    if (!(key in vars) || vars[key] === "" || vars[key].includes("your-")) {
      errors.push(key);
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ ${envFile} — ${errors.length} missing or placeholder variable(s):`);
    for (const key of errors) {
      console.error(`  • ${key}`);
    }
    totalErrors += errors.length;
  } else {
    console.log(`✅ ${envFile} — all required variables set`);
  }
}

if (totalErrors > 0) {
  console.error(`\n❌ Total: ${totalErrors} missing/placeholder variable(s) across env files`);
  process.exit(1);
}

console.log("\n✅ All environment files validated");
