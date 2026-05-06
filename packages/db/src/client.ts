import { PrismaClient } from "@prisma/client";
import { tenantGuardExtension } from "./middleware/tenant-guard";

function createPrismaClient() {
  const client = new PrismaClient({
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  return client.$extends(tenantGuardExtension);
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { ExtendedPrismaClient };
