import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthConfig, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma, platformPrisma } from "@frms/db";
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


const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  tenantSlug: z.string().optional(),
});

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET ?? "",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Tenant", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password, tenantSlug } = parsed.data;

        const user = await platformPrisma.user.findFirst({
          where: { username, status: "ACTIVE" },
          include: { tenant: true },
        });

        if (!user) return null;

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) return null;

        // For non-super_admin users, require tenant context
        if (user.role !== "super_admin") {
          if (!user.tenantId) return null;
          if (tenantSlug && user.tenant?.slug !== tenantSlug) return null;
        }

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant?.slug ?? null,
          securityVersion: user.securityVersion,
        };
      },
    }),
  ],
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
    async session({ session, token }): Promise<Session> {
      // Verify securityVersion is still valid (session invalidation on role/tenant change)
      if (typeof token.userId === "string" && token.userId.length > 0) {
        const dbUser = await platformPrisma.user.findUnique({
          where: { id: token.userId },
          select: { securityVersion: true, status: true },
        });
        if (
          !dbUser ||
          dbUser.status !== "ACTIVE" ||
          dbUser.securityVersion !== token.securityVersion
        ) {
          // Force re-auth — return session with empty user to trigger signout
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
} satisfies NextAuthConfig;
