import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma, platformPrisma } from "@frms/db";
import type { UserRole } from "@frms/shared/types";

import { authConfig } from "./config";
import { authorizeCredentials } from "./authorize";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  tenantSlug: z.string().optional(),
  // Sent over the wire as a URL-encoded form value ("true"/"false"), not a
  // real boolean — see next-auth/react `signIn()` (Credentials POSTs via
  // `application/x-www-form-urlencoded`).
  rememberMe: z
    .string()
    .optional()
    .transform((value) => value === "true"),
});

/**
 * Full Node-runtime Auth.js instance — used by API routes, Server Actions,
 * and RSC. Layers Prisma adapter, Credentials provider with bcrypt+DB
 * authorize, and DB-backed securityVersion verification on top of the
 * Edge-safe base in `./config.ts`.
 *
 * Middleware MUST NOT import from this file — use `./edge.ts` instead.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Tenant", type: "text" },
        rememberMe: { label: "Remember me", type: "checkbox" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password, tenantSlug, rememberMe } = parsed.data;

        const user = await authorizeCredentials({
          username,
          password,
          tenantSlug,
        });
        if (!user) return null;

        return { ...user, rememberMe };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }): Promise<Session> {
      // V28 hardening — verify securityVersion is still valid on every
      // session read. Forces re-auth when role/tenant/status changes.
      if (typeof token.userId === "string" && token.userId.length > 0) {
        try {
          const dbUser = await platformPrisma.user.findUnique({
            where: { id: token.userId },
            select: {
              securityVersion: true,
              status: true,
              tenant: { select: { status: true } },
            },
          });
          if (
            !dbUser ||
            dbUser.status !== "ACTIVE" ||
            dbUser.securityVersion !== token.securityVersion ||
            dbUser.tenant?.status === "SUSPENDED"
          ) {
            throw new Error("SESSION_INVALIDATED");
          }
        } catch (err) {
          // Fail-CLOSED on a definitive invalidation (deleted/inactive user,
          // securityVersion bump, suspended tenant) — re-throw it. Fail-OPEN
          // on any OTHER error (transient DB/pool failure): a DB availability
          // hiccup must NOT be misread as session invalidation and log the
          // user out. Keep the session; the next successful read re-checks.
          if (err instanceof Error && err.message === "SESSION_INVALIDATED") {
            throw err;
          }
          console.error(
            "[auth] securityVersion check skipped (transient DB error, fail-open):",
            err,
          );
        }
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.userId as string,
          username: token.username as string,
          role: token.role as UserRole,
          tenantId: token.tenantId as string | null,
          tenantSlug: token.tenantSlug as string | null,
          securityVersion: token.securityVersion as number,
          customView: token.customView,
        },
      };
    },
  },
});
