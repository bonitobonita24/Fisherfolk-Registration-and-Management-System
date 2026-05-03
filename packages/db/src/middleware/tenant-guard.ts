import { Prisma } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";

const tenantContext = new AsyncLocalStorage<string>();

export function getCurrentTenantId(): string | undefined {
  return tenantContext.getStore();
}

export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return tenantContext.run(tenantId, fn);
}

const SYSTEM_MODELS = ["AuditLog", "Tenant"] as const;

export const tenantGuardExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async $allOperations({ args, query, model, operation }) {
        if ((SYSTEM_MODELS as readonly string[]).includes(model)) {
          return query(args);
        }

        const tenantId = getCurrentTenantId();
        if (tenantId === undefined) {
          throw new Error(
            `Tenant context not set for ${model}.${operation}. Use runWithTenant() to set tenant context.`,
          );
        }

        const mutableArgs = args as Record<string, unknown>;

        if ("where" in mutableArgs && mutableArgs["where"] != null) {
          mutableArgs["where"] = {
            ...(mutableArgs["where"] as object),
            tenantId,
          };
        } else if (
          operation === "findMany" ||
          operation === "findFirst" ||
          operation === "findUnique" ||
          operation === "count" ||
          operation === "aggregate" ||
          operation === "groupBy" ||
          operation === "deleteMany" ||
          operation === "updateMany"
        ) {
          mutableArgs["where"] = { tenantId };
        }

        if ("data" in mutableArgs && mutableArgs["data"] != null) {
          if (Array.isArray(mutableArgs["data"])) {
            mutableArgs["data"] = (
              mutableArgs["data"] as Record<string, unknown>[]
            ).map((item) => ({
              ...item,
              tenantId,
            }));
          } else {
            mutableArgs["data"] = {
              ...(mutableArgs["data"] as object),
              tenantId,
            };
          }
        }

        return query(args);
      },
    },
  },
});
