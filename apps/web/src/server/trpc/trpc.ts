import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { UserRole } from "@frms/shared/types";

import { rateLimiters } from "../lib/rate-limit";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;
  if (process.env.NODE_ENV === "development") {
    console.log(`[tRPC] ${path} — ${durationMs}ms`);
  }
  return result;
});

export const publicProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    const ip =
      ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    rateLimiters.public.check(ip);
    return next({ ctx });
  });

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: ctx.userId,
      role: ctx.role!,
      tenantId: ctx.tenantId,
    },
  });
});

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(enforceAuth)
  .use(async ({ ctx, next }) => {
    rateLimiters.api.check(ctx.userId);
    return next({ ctx });
  });

export const requireRole = (...allowedRoles: UserRole[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.role || !allowedRoles.includes(ctx.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });

export const adminProcedure = protectedProcedure.use(
  requireRole("super_admin", "admin"),
);

export const superAdminProcedure = protectedProcedure.use(
  requireRole("super_admin"),
);
