import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma, platformPrisma } from "@frms/db";
import type { UserRole } from "@frms/shared/types";

import { authConfig } from "./config";

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

        const user = await platformPrisma.user.findFirst({
          where: { username, status: "ACTIVE" },
          include: { tenant: true },
        });

        if (!user) return null;

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) return null;

        if (user.role !== "super_admin") {
          if (!user.tenantId) return null;
          if (tenantSlug && user.tenant?.slug !== tenantSlug) return null;
        }

        if (user.tenant?.status === "SUSPENDED") return null;

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant?.slug ?? null,
          securityVersion: user.securityVersion,
          rememberMe,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }): Promise<Session> {
      // V28 hardening — verify securityVersion is still valid on every
      // session read. Forces re-auth when role/tenant/status changes.
      if (typeof token.userId === "string" && token.userId.length > 0) {
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
        },
      };
    },
  },
});
