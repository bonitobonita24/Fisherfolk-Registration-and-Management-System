import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Prisma } from "@frms/db";
import {
  agendaQuerySchema,
  kanbanTaskCreateSchema,
  setAudienceSchema,
  shareMutationSchema,
  upcomingQuerySchema,
} from "@frms/shared/schemas";
import type { UserRole } from "@frms/shared/types";

import { canManage } from "@/lib/rbac/can-manage";

import { omitUndefined } from "../../lib/prisma-input";
import type { TRPCContext } from "../context";
import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Roles allowed to publish/flip an agenda item to the tenant-wide
 * ANNOUNCED audience. Mirrors the FIS-35 spec's non-viewer allow-list —
 * every staff role except the read-only `viewer` tier.
 */
const ANNOUNCE_ALLOWED_ROLES: UserRole[] = [
  "tenant_manager",
  "tenant_superadmin",
  "tenant_admin",
  "encoder",
  "bantay_dagat",
];

function canAnnounce(role: UserRole | undefined): boolean {
  return role !== undefined && ANNOUNCE_ALLOWED_ROLES.includes(role);
}

// "EVENT"/"PERSONAL" are pseudo-source values the calendar UI may pass in
// `sources` (kind/audience shorthand) — they are not real sourceEntityType
// values, so they're stripped before filtering by sourceEntityType.
const PSEUDO_SOURCES = new Set(["EVENT", "PERSONAL"]);

type AgendaStream = "announced" | "shared" | "entity" | "self";

function deriveStream(
  row: { audience: string; assignedToId: string; sourceEntityType: string | null; _count: { shares: number } },
  userId: string,
): AgendaStream {
  if (row.audience === "ANNOUNCED") return "announced";
  if (row._count.shares > 0 && row.assignedToId !== userId) return "shared";
  if (row.sourceEntityType) return "entity";
  return "self";
}

const agendaSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  startAt: true,
  endAt: true,
  allDay: true,
  kind: true,
  audience: true,
  sourceEntityType: true,
  sourceEntityId: true,
  assignedToId: true,
  assignedTo: { select: { id: true, name: true } },
  createdById: true,
  _count: { select: { shares: true } },
} satisfies Prisma.KanbanTaskSelect;

async function assertTaskInTenant(
  db: TRPCContext["db"],
  tenantId: string,
  taskId: string,
) {
  const task = await db.kanbanTask.findFirst({
    where: { id: taskId, tenantId },
    select: { id: true, createdById: true, assignedToId: true },
  });
  if (!task) throw new TRPCError({ code: "NOT_FOUND" });
  return task;
}

export const agendaRouter = createTRPCRouter({
  myAgenda: protectedProcedure
    .input(agendaQuerySchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const { from, to, sources, statuses, mineOnly } = input;

      const dateInRange: Prisma.KanbanTaskWhereInput = {
        OR: [
          { startAt: { gte: from, lte: to } },
          { AND: [{ startAt: null }, { dueDate: { gte: from, lte: to } }] },
        ],
      };

      const visibility: Prisma.KanbanTaskWhereInput =
        mineOnly === true
          ? { assignedToId: ctx.userId }
          : {
              OR: [
                { assignedToId: ctx.userId },
                { shares: { some: { userId: ctx.userId } } },
                { audience: "ANNOUNCED" },
              ],
            };

      const sourceFilter = sources?.filter((s) => !PSEUDO_SOURCES.has(s));

      const where: Prisma.KanbanTaskWhereInput = {
        tenantId,
        AND: [dateInRange, visibility],
        ...(statuses && statuses.length > 0 ? { status: { in: statuses } } : {}),
        ...(sourceFilter && sourceFilter.length > 0
          ? { sourceEntityType: { in: sourceFilter } }
          : {}),
      };

      const rows = await ctx.db.kanbanTask.findMany({
        where,
        orderBy: [{ startAt: "asc" }, { dueDate: "asc" }],
        select: agendaSelect,
      });

      return rows.map((row) => ({
        ...row,
        stream: deriveStream(row, ctx.userId),
      }));
    }),

  upcoming: protectedProcedure
    .input(upcomingQuerySchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const now = new Date();

      const visibility: Prisma.KanbanTaskWhereInput = {
        OR: [
          { assignedToId: ctx.userId },
          { shares: { some: { userId: ctx.userId } } },
          { audience: "ANNOUNCED" },
        ],
      };

      const effectiveDateUpcoming: Prisma.KanbanTaskWhereInput = {
        OR: [
          { startAt: { gte: now } },
          { AND: [{ startAt: null }, { dueDate: { gte: now } }] },
        ],
      };

      const rows = await ctx.db.kanbanTask.findMany({
        where: {
          tenantId,
          AND: [visibility, effectiveDateUpcoming],
        },
        orderBy: [{ startAt: "asc" }, { dueDate: "asc" }],
        take: input.limit,
        select: agendaSelect,
      });

      return rows.map((row) => ({
        ...row,
        stream: deriveStream(row, ctx.userId),
      }));
    }),

  create: protectedProcedure
    .input(kanbanTaskCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;

      if (input.sourceEntityType && input.sourceEntityId) {
        const where = { id: input.sourceEntityId, tenantId };
        let found: unknown = null;
        switch (input.sourceEntityType) {
          case "fisherfolk":
            found = await ctx.db.fisherfolk.findFirst({ where });
            break;
          case "vessel":
            found = await ctx.db.vessel.findFirst({ where });
            break;
          case "violation":
            found = await ctx.db.violation.findFirst({ where });
            break;
          case "ayudaProgram":
            found = await ctx.db.ayudaProgram.findFirst({ where });
            break;
        }
        if (found === null || found === undefined) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Source record not found",
          });
        }
      }

      if (input.audience === "ANNOUNCED" && !canAnnounce(ctx.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only staff roles can announce agenda items.",
        });
      }

      const { shareWithUserIds, ...taskInput } = input;

      const task = await ctx.db.kanbanTask.create({
        data: omitUndefined({
          ...taskInput,
          assignedToId: input.assignedToId ?? ctx.userId,
          tenantId,
          createdById: ctx.userId,
        }),
      });

      if (shareWithUserIds && shareWithUserIds.length > 0) {
        const users = await ctx.db.user.findMany({
          where: { id: { in: shareWithUserIds }, tenantId },
          select: { id: true },
        });
        if (users.length !== shareWithUserIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more users were not found in this tenant.",
          });
        }
        await ctx.db.kanbanTaskShare.createMany({
          data: shareWithUserIds.map((userId) => ({
            tenantId,
            taskId: task.id,
            userId,
          })),
          skipDuplicates: true,
        });
      }

      return task;
    }),

  share: protectedProcedure
    .input(shareMutationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;

      const task = await assertTaskInTenant(ctx.db, tenantId, input.taskId);
      if (
        task.createdById !== ctx.userId &&
        task.assignedToId !== ctx.userId &&
        !canManage(ctx.role)
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const users = await ctx.db.user.findMany({
        where: { id: { in: input.userIds }, tenantId },
        select: { id: true },
      });
      if (users.length !== input.userIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more users were not found in this tenant.",
        });
      }

      await ctx.db.kanbanTaskShare.createMany({
        data: input.userIds.map((userId) => ({
          tenantId,
          taskId: task.id,
          userId,
        })),
        skipDuplicates: true,
      });

      return { ok: true as const };
    }),

  unshare: protectedProcedure
    .input(shareMutationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;

      const task = await assertTaskInTenant(ctx.db, tenantId, input.taskId);
      if (
        task.createdById !== ctx.userId &&
        task.assignedToId !== ctx.userId &&
        !canManage(ctx.role)
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const users = await ctx.db.user.findMany({
        where: { id: { in: input.userIds }, tenantId },
        select: { id: true },
      });
      if (users.length !== input.userIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more users were not found in this tenant.",
        });
      }

      await ctx.db.kanbanTaskShare.deleteMany({
        where: { taskId: task.id, tenantId, userId: { in: input.userIds } },
      });

      return { ok: true as const };
    }),

  setAudience: protectedProcedure
    .input(setAudienceSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      if (!canAnnounce(ctx.role)) throw new TRPCError({ code: "FORBIDDEN" });

      await assertTaskInTenant(ctx.db, ctx.tenantId, input.taskId);

      return ctx.db.kanbanTask.update({
        where: { id: input.taskId },
        data: { audience: input.audience },
      });
    }),

  announce: protectedProcedure
    .input(z.object({ taskId: z.string() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      if (!canAnnounce(ctx.role)) throw new TRPCError({ code: "FORBIDDEN" });

      await assertTaskInTenant(ctx.db, ctx.tenantId, input.taskId);

      return ctx.db.kanbanTask.update({
        where: { id: input.taskId },
        data: { audience: "ANNOUNCED" },
      });
    }),
});
