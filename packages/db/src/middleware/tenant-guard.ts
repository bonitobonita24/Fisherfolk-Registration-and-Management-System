import { Prisma } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";

const globalForTenant = globalThis as unknown as {
  __frmsTenantContext?: AsyncLocalStorage<string>;
};
const tenantContext =
  globalForTenant.__frmsTenantContext ?? new AsyncLocalStorage<string>();
globalForTenant.__frmsTenantContext = tenantContext;

export function getCurrentTenantId(): string | undefined {
  return tenantContext.getStore();
}

export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return tenantContext.run(tenantId, fn);
}

/**
 * Models that intentionally live OUTSIDE tenant scoping. `Tenant` is the tenant
 * registry itself; `AuditLog` is written by the platform layer. Every other
 * model MUST be tenant-scoped.
 */
const SYSTEM_MODELS = ["AuditLog", "Tenant"] as const;

export function isSystemModel(model: string | undefined): boolean {
  return (
    model !== undefined &&
    (SYSTEM_MODELS as readonly string[]).includes(model)
  );
}

/**
 * Throws if no tenant context is active. Pulled out so the guarantee
 * "guarded queries cannot run without a tenant" is independently testable.
 */
export function assertTenantContext(
  tenantId: string | undefined,
  model: string,
  operation: string,
): asserts tenantId is string {
  if (tenantId === undefined) {
    throw new Error(
      `Tenant context not set for ${model}.${operation}. Use runWithTenant() to set tenant context.`,
    );
  }
}

const SCOPED_WRITE_OR_READ_OPERATIONS = new Set([
  "findMany",
  "findFirst",
  "findUnique",
  "count",
  "aggregate",
  "groupBy",
  "deleteMany",
  "updateMany",
]);

/**
 * Force `tenantId` onto a Prisma operation's `where` and `data`. This is the
 * heart of multi-tenant isolation, so two properties are guaranteed and tested:
 *
 *  1. `tenantId` is spread LAST into `where`, so a caller-supplied `tenantId`
 *     (a forged cross-tenant read) is always OVERRIDDEN by the active tenant.
 *  2. `data` (single or array) always carries the active `tenantId`, so a row
 *     can never be created/updated into another tenant.
 *
 * Mutates `args` in place (matching the Prisma extension contract) and returns
 * it for convenience in tests.
 */
export function scopeArgsToTenant(
  operation: string,
  args: Record<string, unknown>,
  tenantId: string,
): Record<string, unknown> {
  if ("where" in args && args["where"] != null) {
    args["where"] = {
      ...(args["where"] as object),
      tenantId,
    };
  } else if (SCOPED_WRITE_OR_READ_OPERATIONS.has(operation)) {
    args["where"] = { tenantId };
  }

  if ("data" in args && args["data"] != null) {
    if (Array.isArray(args["data"])) {
      args["data"] = (args["data"] as Record<string, unknown>[]).map(
        (item) => ({ ...item, tenantId }),
      );
    } else {
      args["data"] = {
        ...(args["data"] as object),
        tenantId,
      };
    }
  }

  return args;
}

export const tenantGuardExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async $allOperations({ args, query, model, operation }) {
        if (isSystemModel(model)) {
          return query(args);
        }

        const tenantId = getCurrentTenantId();
        assertTenantContext(tenantId, model, operation);

        scopeArgsToTenant(operation, args as Record<string, unknown>, tenantId);

        return query(args);
      },
    },
  },
});
