import { PrismaClient } from "@prisma/client";
import { tenantGuardExtension } from "./middleware/tenant-guard";

const basePrismaLog =
  process.env["NODE_ENV"] === "development"
    ? ["query", "error", "warn"] as ("query" | "error" | "warn")[]
    : ["error"] as ("error")[];

function createPrismaClient() {
  const client = new PrismaClient({ log: basePrismaLog });
  return client.$extends(tenantGuardExtension);
}

function createPlatformPrismaClient() {
  return new PrismaClient({ log: basePrismaLog });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
  platformPrisma: PrismaClient | undefined;
};

export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

// Unguarded client for auth and platform-level operations that run without tenant context
export const platformPrisma: PrismaClient =
  globalForPrisma.platformPrisma ?? createPlatformPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.platformPrisma = platformPrisma;
}

export type { ExtendedPrismaClient };
