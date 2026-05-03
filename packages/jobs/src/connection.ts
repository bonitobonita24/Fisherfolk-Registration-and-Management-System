import { type ConnectionOptions } from "bullmq";

function getRedisUrl(): string {
  const url = process.env["REDIS_URL"];
  if (url === undefined || url === "") {
    throw new Error("REDIS_URL environment variable is required");
  }
  return url;
}

function parseRedisUrl(url: string): ConnectionOptions {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password !== "" ? decodeURIComponent(parsed.password) : undefined,
    maxRetriesPerRequest: null,
  };
}

export function getConnection(): ConnectionOptions {
  return parseRedisUrl(getRedisUrl());
}
