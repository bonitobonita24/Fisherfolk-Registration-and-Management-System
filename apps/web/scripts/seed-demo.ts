#!/usr/bin/env tsx
/**
 * seed-demo.ts — Seed DEMO data for the non-fisherfolk modules (Vessels, Ayuda
 * programs/beneficiaries, Violations) so every screen has realistic content.
 *
 * ⚠ DEV + DEMO ONLY — data-governance policy (owner-set 2026-07-08, see
 *   docs/DATA_SEEDING_POLICY.md). These are FABRICATED records; they must NEVER
 *   be seeded into staging or production, which carry the official data with the
 *   official records only. The hard guard below refuses to run unless
 *   ALLOW_DEMO_SEED is explicitly set (set it ONLY for local dev or the demo stack).
 *
 * Fisherfolk records are NOT created here — those come from the official
 * masterlist via import-fmo.ts. This script links demo Vessels/Ayuda/Violations
 * to whatever fisherfolk already exist in the target tenant.
 *
 * All generated rows are clearly marked (mfvrNumber "DEMO-MFVR-*", violation
 * subjects prefixed "[DEMO]", ayuda titles suffixed "(Demo)") so they can be
 * identified and purged later. Idempotent — safe to re-run.
 *
 * Usage (run from apps/web):
 *   pnpm exec tsx scripts/seed-demo.ts \
 *     [--tenant <slug>]        (default: "calapan-city")
 *     [--vessels <n>]          (default: 80)
 *     [--beneficiaries <n>]    (per program, default: 40)
 *     [--violations <n>]       (default: 12)
 *     [--seed <n>]             (RNG seed, default: 42)
 */

import fs from "node:fs";
import path from "node:path";

// ── Bootstrap: load repo-root env before PrismaClient instantiation ──────────
function loadEnvFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const raw of content.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      // Never override an env var already set by the caller (deploy script
      // exports the remote DATABASE_URL before invoking this).
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* file absent — skip */
  }
}
loadEnvFile(path.resolve(process.cwd(), "../../.env.dev"));
loadEnvFile(path.resolve(process.cwd(), "../../.env"));

// ── HARD GUARD — dummy/demo data is for DEV + DEMO ONLY ──────────────────────
// Data-governance policy (owner-set 2026-07-08 — docs/DATA_SEEDING_POLICY.md):
// this script fabricates DEMO Vessels/Ayuda/Violations, which must NEVER reach
// staging or production. Detecting "localhost" is NOT a safe guard here — remote
// seeding runs over an SSH tunnel that makes a remote DB look local. So demo
// seeding is OPT-IN: it refuses unless ALLOW_DEMO_SEED is set. Set that flag ONLY
// when the target DATABASE_URL is local dev or the demo stack.
if (
  process.env["ALLOW_DEMO_SEED"] !== "1" &&
  process.env["ALLOW_DEMO_SEED"] !== "true"
) {
  console.error(
    "❌ REFUSED: seed-demo.ts writes DUMMY/DEMO records (Vessels/Ayuda/Violations).\n" +
      "   Policy (docs/DATA_SEEDING_POLICY.md): demo data is for LOCAL DEV + the DEMO\n" +
      "   stack ONLY — NEVER staging or production. Re-run with ALLOW_DEMO_SEED=1 only\n" +
      "   when the target DB is local dev or the demo stack.",
  );
  process.exit(1);
}

import { PrismaClient } from "@frms/db";

// ── CLI args ─────────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = rawArgs.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  const next = rawArgs[idx + 1];
  return typeof next === "string" && !next.startsWith("--") ? next : undefined;
}
function intArg(name: string, def: number): number {
  const v = getArg(name);
  return v !== undefined && /^\d+$/.test(v) ? parseInt(v, 10) : def;
}

const tenantSlug = getArg("tenant") ?? "calapan-city";
const N_VESSELS = intArg("vessels", 80);
const N_BENEF = intArg("beneficiaries", 40);
const N_VIOLATIONS = intArg("violations", 12);
const N_KANBAN = intArg("kanban", 15);

// ── Deterministic RNG (mulberry32) ───────────────────────────────────────────
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(intArg("seed", 42));
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]!;
const randInt = (lo: number, hi: number): number => lo + Math.floor(rng() * (hi - lo + 1));

const VESSEL_TYPES = ["Motorized Banca", "Non-Motorized Banca", "Fishing Boat", "Pump Boat"];
const HULL = ["Wood", "Fiberglass", "Composite"];
const GEAR = ["Hook and Line", "Gill Net", "Fish Trap", "Cast Net", "Spear", "Long Line"];
const ENGINE_MAKES = ["Briggs & Stratton", "Honda", "Yamaha", "Kohler", "Robin"];

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new Error(`Tenant not found: ${tenantSlug}`);
    const tenantId = tenant.id;

    // Acting user for createdBy/filedBy — prefer a tenant_admin/tenant_superadmin,
    // else any user. NOTE: since the 2026-07-09 role split the LGU tenant's top
    // account is role `tenant_superadmin` (tenant_manager lives on the separate
    // `platform` tenant), so we match both roles here.
    const actor =
      (await prisma.user.findFirst({
        where: { tenantId, role: { in: ["tenant_manager", "tenant_superadmin"] } },
      })) ?? (await prisma.user.findFirst({ where: { tenantId } }));
    if (!actor) throw new Error(`No user found for tenant ${tenantSlug} — cannot attribute demo data.`);

    // Linking pool of existing fisherfolk.
    const ff = await prisma.fisherfolk.findMany({
      where: { tenantId },
      select: { id: true },
      take: 600,
      orderBy: { idNumber: "asc" },
    });
    if (ff.length === 0) {
      throw new Error("No fisherfolk in this tenant — import the masterlist first, then seed demo data.");
    }
    const ffIds = ff.map((f) => f.id);
    console.log(`ℹ  Tenant ${tenantSlug}: ${ffIds.length} fisherfolk available for linking.`);

    // ── Vessels ───────────────────────────────────────────────────────────────
    let vesselCreated = 0;
    const demoVesselIds: string[] = [];
    for (let i = 1; i <= N_VESSELS; i++) {
      const mfvrNumber = `DEMO-MFVR-${String(i).padStart(4, "0")}`;
      const ownerId = pick(ffIds);
      const vessel = await prisma.vessel.upsert({
        where: { tenantId_mfvrNumber: { tenantId, mfvrNumber } },
        update: {},
        create: {
          tenantId,
          mfvrNumber,
          vesselName: `Demo Vessel ${i}`,
          vesselType: pick(VESSEL_TYPES),
          hullMaterial: pick(HULL),
          yearBuilt: randInt(2005, 2024),
          registeredLength: Number((randInt(40, 120) / 10).toFixed(1)),
          grossTonnage: Number((randInt(5, 30) / 10).toFixed(2)),
          engineMake: pick(ENGINE_MAKES),
          horsepower: randInt(8, 40),
          fishingGearClassification: [pick(GEAR)],
          status: rng() < 0.85 ? "ACTIVE" : rng() < 0.5 ? "INACTIVE" : "IMPOUNDED",
          createdById: actor.id,
          owners: { connect: [{ id: ownerId }] },
        },
        select: { id: true },
      });
      demoVesselIds.push(vessel.id);
      vesselCreated++;
    }
    console.log(`✅  Vessels: ${vesselCreated} ensured (DEMO-MFVR-*).`);

    // ── Households (demo grouping — 1 head + 2-4 members per household) ────────
    // Only pulls fisherfolk with householdId === null so re-runs never steal
    // people already assigned to a household (idempotent), and each household
    // number is checked before creation so re-runs never duplicate a number.
    // Realistic demo volume so "Households by barangay (top 15)" fills
    // (raised from the original 6 — matches the prior calapan-demo dataset).
    const HOUSEHOLDS_TARGET = 45;
    const existingHouseholdCount = await prisma.household.count({ where: { tenantId } });
    let householdCreated = 0;
    const demoHouseholdIds: string[] = [];

    if (existingHouseholdCount < HOUSEHOLDS_TARGET) {
      const unassigned = await prisma.fisherfolk.findMany({
        where: { tenantId, householdId: null },
        select: { id: true, barangay: true, address: true },
        orderBy: { idNumber: "asc" },
        take: 300,
      });

      let cursor = 0;
      let sequence = existingHouseholdCount + 1;
      const toCreate = HOUSEHOLDS_TARGET - existingHouseholdCount;

      for (let h = 0; h < toCreate; h++) {
        const groupSize = randInt(3, 5); // 1 head + 2-4 members
        if (cursor + groupSize > unassigned.length) break; // not enough left to form a group

        const group = unassigned.slice(cursor, cursor + groupSize);
        cursor += groupSize;
        const head = group[0]!;
        const members = group.slice(1);

        let created: { id: string } | null = null;
        let attempts = 0;
        while (attempts < 8 && !created) {
          const householdNumber = `HH-${String(sequence).padStart(4, "0")}`;
          const exists = await prisma.household.findUnique({
            where: { tenantId_householdNumber: { tenantId, householdNumber } },
            select: { id: true },
          });
          if (exists) {
            sequence++;
            attempts++;
            continue;
          }
          created = await prisma.$transaction(async (tx) => {
            const household = await tx.household.create({
              data: {
                tenantId,
                householdNumber,
                headId: head.id,
                barangay: head.barangay,
                address: head.address,
                notes: "Demonstration household seeded for testing.",
                createdById: actor.id,
              },
              select: { id: true },
            });
            await tx.fisherfolk.update({
              where: { id: head.id },
              data: { householdId: household.id },
            });
            if (members.length > 0) {
              await tx.fisherfolk.updateMany({
                where: { id: { in: members.map((m) => m.id) }, tenantId },
                data: { householdId: household.id },
              });
            }
            return household;
          });
          sequence++;
        }
        if (created) {
          demoHouseholdIds.push(created.id);
          householdCreated++;
        }
      }
    }
    console.log(`✅  Households: ${householdCreated} created (target ${HOUSEHOLDS_TARGET}, HH-****).`);

    // HEAL pass: households snapshot the head's barangay/address at creation.
    // When the demo fisherfolk seed repairs barangay names (generic
    // "Barangay N" → real centroid-keyed names), re-sync every household to
    // its head's CURRENT barangay/address so the households-by-barangay chart
    // and density map stay consistent. Idempotent — no-op once in sync.
    const householdsWithHeads = await prisma.household.findMany({
      where: { tenantId },
      select: {
        id: true,
        barangay: true,
        address: true,
        head: { select: { barangay: true, address: true } },
      },
    });
    let householdsHealed = 0;
    for (const hh of householdsWithHeads) {
      if (hh.barangay !== hh.head.barangay || hh.address !== hh.head.address) {
        await prisma.household.update({
          where: { id: hh.id },
          data: { barangay: hh.head.barangay, address: hh.head.address },
        });
        householdsHealed++;
      }
    }
    console.log(`✅  Households heal: ${householdsHealed} re-synced to head barangay/address.`);

    // ── Ayuda programs + beneficiaries ──────────────────────────────────────────
    const PROGRAMS = [
      { title: "Fuel Subsidy 2026 (Demo)", status: "ACTIVE" as const },
      { title: "Typhoon Relief Assistance (Demo)", status: "COMPLETED" as const },
      { title: "Fishing Gear Distribution (Demo)", status: "ACTIVE" as const },
    ];
    for (const p of PROGRAMS) {
      let program = await prisma.ayudaProgram.findFirst({ where: { tenantId, title: p.title } });
      if (!program) {
        program = await prisma.ayudaProgram.create({
          data: {
            tenantId,
            title: p.title,
            description: "Demonstration ayuda program seeded for testing.",
            filters: {},
            status: p.status,
            createdById: actor.id,
          },
        });
      }
      // Pick N distinct fisherfolk.
      const pool = [...ffIds];
      const chosen: string[] = [];
      const take = Math.min(N_BENEF, pool.length);
      for (let k = 0; k < take; k++) {
        const idx = Math.floor(rng() * pool.length);
        chosen.push(pool.splice(idx, 1)[0]!);
      }
      let received = 0;
      for (const fid of chosen) {
        const isReceived = rng() < 0.6;
        if (isReceived) received++;
        await prisma.ayudaBeneficiary.upsert({
          where: { programId_fisherfolkId: { programId: program.id, fisherfolkId: fid } },
          update: {},
          create: {
            tenantId,
            programId: program.id,
            fisherfolkId: fid,
            verificationStatus: isReceived ? "RECEIVED" : "PENDING",
            ...(isReceived ? { verifiedById: actor.id, verifiedAt: new Date() } : {}),
          },
        });
      }
      const total = await prisma.ayudaBeneficiary.count({ where: { programId: program.id } });
      const recvTotal = await prisma.ayudaBeneficiary.count({
        where: { programId: program.id, verificationStatus: "RECEIVED" },
      });
      await prisma.ayudaProgram.update({
        where: { id: program.id },
        data: {
          beneficiaryCount: total,
          verifiedCount: recvTotal,
          notReceivedCount: total - recvTotal,
        },
      });
      console.log(`✅  Ayuda "${p.title}": ${total} beneficiaries (${recvTotal} received).`);
    }

    // ── Ayuda: per-household demo program (distributionUnit = HOUSEHOLD) ───────
    const PER_HOUSEHOLD_TITLE = "Per Household Relief (Demo)";
    let perHouseholdProgram = await prisma.ayudaProgram.findFirst({
      where: { tenantId, title: PER_HOUSEHOLD_TITLE },
    });
    if (!perHouseholdProgram) {
      perHouseholdProgram = await prisma.ayudaProgram.create({
        data: {
          tenantId,
          title: PER_HOUSEHOLD_TITLE,
          description: "Demonstration per-household ayuda program seeded for testing.",
          filters: {},
          status: "ACTIVE",
          distributionUnit: "HOUSEHOLD",
          createdById: actor.id,
        },
      });
    }
    const allHouseholds = await prisma.household.findMany({
      where: { tenantId },
      select: { id: true, headId: true },
      take: 50,
    });
    let householdBenefCreated = 0;
    for (const hh of allHouseholds) {
      const before = await prisma.ayudaBeneficiary.findUnique({
        where: { programId_fisherfolkId: { programId: perHouseholdProgram.id, fisherfolkId: hh.headId } },
      });
      const isReceived = rng() < 0.6;
      await prisma.ayudaBeneficiary.upsert({
        where: { programId_fisherfolkId: { programId: perHouseholdProgram.id, fisherfolkId: hh.headId } },
        update: {},
        create: {
          tenantId,
          programId: perHouseholdProgram.id,
          fisherfolkId: hh.headId,
          householdId: hh.id,
          verificationStatus: isReceived ? "RECEIVED" : "PENDING",
          ...(isReceived ? { verifiedById: actor.id, verifiedAt: new Date() } : {}),
        },
      });
      if (!before) householdBenefCreated++;
    }
    const totalHH = await prisma.ayudaBeneficiary.count({ where: { programId: perHouseholdProgram.id } });
    const recvHH = await prisma.ayudaBeneficiary.count({
      where: { programId: perHouseholdProgram.id, verificationStatus: "RECEIVED" },
    });
    await prisma.ayudaProgram.update({
      where: { id: perHouseholdProgram.id },
      data: {
        beneficiaryCount: totalHH,
        verifiedCount: recvHH,
        notReceivedCount: totalHH - recvHH,
      },
    });
    console.log(
      `✅  Ayuda "${PER_HOUSEHOLD_TITLE}": ${totalHH} household beneficiaries (${recvHH} received), ${householdBenefCreated} new.`,
    );

    // ── Violations ──────────────────────────────────────────────────────────────
    const existingDemoViolations = await prisma.violation.count({
      where: { tenantId, subject: { startsWith: "[DEMO]" } },
    });
    let violationCreated = 0;
    const SUBJECTS = [
      "Fishing without permit",
      "Use of illegal fishing gear",
      "Fishing in protected area",
      "Unregistered vessel operation",
      "Catch exceeds allowable limit",
      "Expired vessel registration",
    ];
    for (let i = existingDemoViolations; i < N_VIOLATIONS; i++) {
      const onVessel = rng() < 0.5 && demoVesselIds.length > 0;
      const lifted = rng() < 0.3;
      await prisma.violation.create({
        data: {
          tenantId,
          targetType: onVessel ? "VESSEL" : "FISHERFOLK",
          fisherfolkId: onVessel ? null : pick(ffIds),
          vesselId: onVessel ? pick(demoVesselIds) : null,
          subject: `[DEMO] ${pick(SUBJECTS)}`,
          details: "Demonstration violation record seeded for testing.",
          status: lifted ? "LIFTED" : "ACTIVE",
          filedById: actor.id,
          ...(lifted ? { liftedById: actor.id, liftedAt: new Date(), resolutionNotes: "Resolved (demo)." } : {}),
        },
      });
      violationCreated++;
    }
    console.log(`✅  Violations: ${violationCreated} created (target ${N_VIOLATIONS}, [DEMO] prefix).`);

    // ── Kanban tasks ────────────────────────────────────────────────────────────
    const existingDemoTasks = await prisma.kanbanTask.count({
      where: { tenantId, title: { startsWith: "[DEMO]" } },
    });
    const KANBAN_STATUS = ["TODO", "IN_PROGRESS", "DONE"] as const;
    const KANBAN_PRIORITY = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
    const TASK_TITLES = [
      "Verify new fisherfolk registrations",
      "Follow up on pending edit requests",
      "Schedule vessel inspection",
      "Reconcile ayuda beneficiary list",
      "Resolve open violation cases",
      "Update barangay alias mappings",
      "Prepare monthly masterlist report",
      "Review duplicate registration flags",
      "Coordinate fishing gear distribution",
      "Audit impounded vessel records",
    ];
    let kanbanCreated = 0;
    for (let i = existingDemoTasks; i < N_KANBAN; i++) {
      await prisma.kanbanTask.create({
        data: {
          tenantId,
          assignedToId: actor.id,
          title: `[DEMO] ${TASK_TITLES[i % TASK_TITLES.length]}`,
          description: "Demonstration board task seeded for testing.",
          status: pick([...KANBAN_STATUS]),
          priority: pick([...KANBAN_PRIORITY]),
        },
      });
      kanbanCreated++;
    }
    console.log(`✅  Kanban: ${kanbanCreated} created (target ${N_KANBAN}, [DEMO] prefix).`);

    console.log("\n🎉  Demo data seed complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌  seed-demo failed:", err);
  process.exit(1);
});
