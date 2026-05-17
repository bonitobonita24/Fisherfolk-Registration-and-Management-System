import type { NextAuthConfig, Session } from "next-auth";

import type { UserRole } from "@frms/shared/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string | null;
      name: string | null;
      role: UserRole;
      tenantId: string | null;
      tenantSlug: string | null;
      securityVersion: number;
    };
  }
  interface User {
    id?: string;
    username: string;
    email: string | null;
    name: string | null;
    role: UserRole;
    tenantId: string | null;
    tenantSlug: string | null;
    securityVersion: number;
  }
}

/**
 * Edge-safe Auth.js config — NO Prisma, NO bcrypt, NO DB calls.
 *
 * The `providers` array is intentionally empty here; the real Credentials
 * provider (with bcrypt + DB lookup) is added in `./index.ts` for the
 * Node-runtime instance used by API routes + RSC. Middleware imports the
 * Edge instance from `./edge.ts` so it can run on Edge runtime without
 * pulling Prisma into the bundle.
 *
 * The session callback here is a pure JWT → session copy (no DB). The
 * Node instance overrides it to also verify securityVersion against the
 * DB for session invalidation on role/tenant change (V28 hardening).
 */
export const authConfig = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET ?? "",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user !== undefined) {
        token.userId = user.id ?? "";
        token.username = user.username;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.securityVersion = user.securityVersion;
      }
      return token;
    },
    session({ session, token }): Session {
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
} satisfies NextAuthConfig;
