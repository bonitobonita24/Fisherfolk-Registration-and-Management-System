import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { Session } from "next-auth";

import { prisma } from "@frms/db";
import type { UserRole } from "@frms/shared/types";

import { auth } from "../auth";

export type TRPCContext = {
  session: Session | null;
  userId: string | null;
  role: UserRole | null;
  tenantId: string | null;
  tenantSlug: string | null;
  db: typeof prisma;
  req: Request;
};

export async function createTRPCContext(
  opts: FetchCreateContextFnOptions,
): Promise<TRPCContext> {
  const session = await auth();

  return {
    session,
    userId: session?.user.id ?? null,
    role: session?.user.role ?? null,
    tenantId: session?.user.tenantId ?? null,
    tenantSlug: session?.user.tenantSlug ?? null,
    db: prisma,
    req: opts.req,
  };
}
