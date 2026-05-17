import NextAuth from "next-auth";

import { authConfig } from "./config";

/**
 * Edge-runtime Auth.js instance — used by middleware ONLY.
 *
 * This intentionally omits Prisma, bcrypt, and the Credentials authorize
 * callback so the middleware bundle stays Edge-compatible. JWT decoding
 * + role/tenant routing decisions work fine off the JWT alone.
 *
 * For API routes, Server Actions, and RSC, import from `./index.ts`
 * instead — that instance has the full Prisma adapter, Credentials
 * provider, and DB-backed session-invalidation check.
 */
export const { auth } = NextAuth(authConfig);
