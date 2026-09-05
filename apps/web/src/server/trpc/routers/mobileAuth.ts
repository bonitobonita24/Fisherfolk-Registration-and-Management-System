/**
 * mobileAuth router (FIS-37) — server-side bearer-token auth foundation for
 * the future mobile app. Shares the SAME credential-verify path as the web
 * Auth.js Credentials provider (`../../auth/authorize.ts`), never a forked
 * copy of the bcrypt/status/tenant/securityVersion logic.
 *
 * `login` is `publicProcedure` (no session exists yet) but is rate-limited
 * via `rateLimiters.auth` (the same strict auth-endpoint limiter used
 * elsewhere) to blunt credential-stuffing/brute-force. Both failure paths
 * (unknown user / wrong password / inactive / unknown tenant) return the
 * SAME generic `UNAUTHORIZED` message — no user-enumeration.
 *
 * `me` runs on `protectedProcedure`, which (via `../context.ts`) now
 * authenticates transparently from either a web cookie session OR a mobile
 * `Authorization: Bearer <token>` header — no separate procedure needed.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { authorizeCredentials } from "../../auth/authorize";
import { issueMobileToken } from "../../auth/mobile-token";
import { rateLimiters } from "../../lib/rate-limit";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const GENERIC_AUTH_ERROR = "Invalid username, password, or tenant.";

const loginInput = z.object({
  orgSlug: z.string().min(1).optional(),
  username: z.string().min(1),
  password: z.string().min(1),
});

export const mobileAuthRouter = createTRPCRouter({
  login: publicProcedure.input(loginInput).mutation(async ({ ctx, input }) => {
    const ip =
      ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    // Strict auth-endpoint rate limit (same limiter as other login-adjacent
    // surfaces) — keyed by IP, independent of the lenient `public` limiter
    // `publicProcedure`'s own middleware already applied.
    rateLimiters.auth.check(ip);

    const user = await authorizeCredentials({
      username: input.username,
      password: input.password,
      tenantSlug: input.orgSlug,
    });

    if (!user) {
      // Fail-CLOSED + GENERIC — never reveal which check failed.
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: GENERIC_AUTH_ERROR,
      });
    }

    const { token, expiresAt } = await issueMobileToken({
      id: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenantSlug,
      role: user.role,
      securityVersion: user.securityVersion,
    });

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        tenantSlug: user.tenantSlug,
      },
    };
  }),

  me: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.userId,
      role: ctx.role,
      tenantId: ctx.tenantId,
      tenantSlug: ctx.tenantSlug,
      name: ctx.session?.user.name ?? null,
      username: ctx.session?.user.username ?? null,
      email: ctx.session?.user.email ?? null,
    };
  }),
});
