import type { NextAuthConfig, Session } from "next-auth";
import { encode as defaultEncode } from "next-auth/jwt";

import type { UserRole } from "@frms/shared/types";
// Type-only import — erased at compile time, so this stays EDGE-SAFE (no
// runtime/Prisma code from `@frms/shared/rbac` ever enters this bundle).
import type { FeatureKey } from "@frms/shared/rbac";

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
      /**
       * Custom-role "view" feature set (PD-005 Chunk 4) — minted at sign-in
       * by `authorize()`. `undefined` for fixed-tier users (no custom role
       * possible); `null` for domain-role users with no `customRoleId`
       * assigned; `FeatureKey[]` (possibly empty — deactivated role) for a
       * domain-role user with a custom role attached.
       */
      customView?: FeatureKey[] | null | undefined;
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
    /** "Remember me" choice captured at sign-in (Credentials `authorize`). */
    rememberMe?: boolean;
    /** See `Session.user.customView` above. */
    customView?: FeatureKey[] | null | undefined;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** Carried from `User.rememberMe` on sign-in; drives session/cookie lifetime. */
    rememberMe?: boolean;
    /** Carried from `User.customView` on sign-in — see `Session.user.customView`. */
    customView?: FeatureKey[] | null | undefined;
  }
}

/**
 * "Remember me" session lifetimes (Rule: no native per-login `maxAge` in
 * Auth.js v5 — this is the documented workaround: override `jwt.encode` to
 * set a shorter/longer `exp` claim on the encrypted JWT based on a flag
 * carried through the token. See authjs.dev reference/core/jwt (JWTOptions
 * `encode`/`maxAge`) — the encrypted JWT's `exp` is enforced automatically
 * on every `decode()` (jose `jwtDecrypt`), so no `decode` override is
 * needed. Kept in the EDGE-SAFE shared config (not just the Node instance)
 * because Auth.js re-encodes/refreshes the session cookie on every session
 * read (sliding expiration) — including from `edge.ts`/middleware — and
 * that refresh must respect the same rememberMe-derived maxAge.
 *
 * NOTE: the browser cookie's own `Max-Age`/`expires` header is computed by
 * Auth.js from the top-level `session.maxAge` (a single static value for
 * every login — Auth.js has no per-request hook for that), so the cookie
 * itself is always written for the long ceiling below. Functional session
 * length for a non-remembered login is still enforced correctly because
 * the shorter `exp` is embedded *inside* the encrypted JWT payload and
 * `decode()` rejects it once expired, regardless of how long the (now
 * inert) cookie lingers in the browser.
 */
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60; // 30 days — checkbox ticked
const DEFAULT_SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours — checkbox unticked (default)

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
  // `session.maxAge` is the ceiling used to compute the browser cookie's
  // Max-Age (see note above) — set to the "remembered" duration. Actual
  // functional session length is enforced per-login via `jwt.encode` below.
  session: { strategy: "jwt", maxAge: REMEMBER_ME_MAX_AGE },
  jwt: {
    maxAge: REMEMBER_ME_MAX_AGE,
    async encode(params) {
      const rememberMe = params.token?.rememberMe === true;
      return defaultEncode({
        ...params,
        maxAge: rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_SESSION_MAX_AGE,
      });
    },
  },
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
        token.rememberMe = user.rememberMe ?? false;
        token.customView = user.customView;
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
          customView: token.customView,
        },
      };
    },
  },
} satisfies NextAuthConfig;
