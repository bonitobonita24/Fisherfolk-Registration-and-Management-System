#!/usr/bin/env tsx
/**
 * seed-demo-calapan-extras.ts — Seed the LONG-TAIL demo records for the demo
 * tenant so no menu/screen is ever blank: FishCatch (+species), Notification,
 * EditRequest, Category, IDTemplate, AuditLog, RegistrationRenewal,
 * ImportBatch, IDPrintBatch.
 *
 * ⚠ DEMO ONLY. Assumes the tenant (default slug "calapan-demo") + its
 * fisherfolk + users already exist (created by a sibling script, e.g.
 * seed-demo.ts / a tenant-provisioning script). This script only LINKS to
 * existing fisherfolk/users — it never creates a tenant, fisherfolk, or users.
 *
 * Idempotent — safe to re-run. Deterministic RNG (mulberry32) seeded via
 * --seed so re-runs produce the same record set (upsert-based where a natural
 * unique key exists; count-gated create loops elsewhere, mirroring
 * apps/web/scripts/seed-demo.ts's Violations/Kanban pattern).
 *
 * Usage (run from apps/web):
 *   pnpm --filter @frms/web exec tsx scripts/seed-demo-calapan-extras.ts \
 *     [--tenant <slug>]   (default: "calapan-demo")
 *     [--seed <n>]        (default: 7777)
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
      // Never override an env var already set by the caller.
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* file absent — skip */
  }
}
loadEnvFile(path.resolve(process.cwd(), "../../.env.dev"));
loadEnvFile(path.resolve(process.cwd(), "../../.env"));

// ── HARD GUARD — dummy/demo data is for DEV + DEMO ONLY ──────────────────────
// Mirrors apps/web/scripts/seed-demo.ts (docs/DATA_SEEDING_POLICY.md, owner-set
// 2026-07-08). Refuses to run unless ALLOW_DEMO_SEED is explicitly set.
if (
  process.env["ALLOW_DEMO_SEED"] !== "1" &&
  process.env["ALLOW_DEMO_SEED"] !== "true"
) {
  console.error(
    "❌ REFUSED: seed-demo-calapan-extras.ts writes DUMMY/DEMO records (FishCatch/\n" +
      "   Notification/EditRequest/Category/IDTemplate/AuditLog/RegistrationRenewal/\n" +
      "   ImportBatch/IDPrintBatch). Policy (docs/DATA_SEEDING_POLICY.md): demo data is\n" +
      "   for LOCAL DEV + the DEMO stack ONLY — NEVER staging or production. Re-run\n" +
      "   with ALLOW_DEMO_SEED=1 only when the target DB is local dev or the demo stack.",
  );
  process.exit(1);
}

import { PrismaClient, type GearType, type EditRequestStatus, type NotificationType } from "@frms/db";

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

const tenantSlug = getArg("tenant") ?? "calapan-demo";
const SEED = intArg("seed", 7777);

const N_FISH_CATCHES = 120;
const N_NOTIFICATIONS = 30;
const N_EDIT_REQUESTS = 15;
const N_AUDIT_LOGS = 40;
const N_RENEWALS = 20;

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
const rng = makeRng(SEED);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]!;
const randInt = (lo: number, hi: number): number => lo + Math.floor(rng() * (hi - lo + 1));
const randDate = (daysAgoMax: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysAgoMax));
  return d;
};

const GEAR_TYPES: GearType[] = [
  "GILL_NET",
  "HOOK_AND_LINE",
  "HANDLINE",
  "LONGLINE",
  "FISH_CORRAL",
  "FISH_TRAP",
  "BEACH_SEINE",
  "RING_NET",
  "CAST_NET",
  "LIFT_NET",
  "SCOOP_NET",
  "SPEAR_GUN",
  "FISH_POT",
  "CRAB_LIFT_NET",
  "SQUID_JIG",
  "GLEANING",
  "OTHER",
];

const PH_FISH_SPECIES = [
  "Bangus",
  "Tilapia",
  "Galunggong",
  "Tamban",
  "Tulingan",
  "Lapu-Lapu",
  "Maya-maya",
  "Bisugo",
  "Alumahan",
  "Dilis",
  "Pusit",
  "Alimango",
  "Sugpo",
];

const NOTIFICATION_TYPES: NotificationType[] = ["INFO", "WARNING", "SUCCESS", "ERROR"];
const NOTIFICATION_MESSAGES: Array<{ type: NotificationType; title: string; message: string }> = [
  { type: "INFO", title: "New fisherfolk registered", message: "A new fisherfolk record was added to your barangay." },
  { type: "SUCCESS", title: "Edit request approved", message: "Your requested edit was approved and applied." },
  { type: "WARNING", title: "Vessel registration expiring soon", message: "A vessel registration is due for renewal within 30 days." },
  { type: "ERROR", title: "Import batch failed rows", message: "Some rows in the last import batch failed validation." },
  { type: "INFO", title: "Ayuda program updated", message: "Beneficiary counts were refreshed for an ayuda program." },
  { type: "WARNING", title: "Violation filed", message: "A new violation was filed and requires review." },
  { type: "SUCCESS", title: "ID batch printed", message: "An ID print batch completed successfully." },
];

const CATEGORY_DEFS: Array<{ name: string; emoji: string; color: string }> = [
  { name: "Municipal Fisherfolk", emoji: "🎣", color: "#2563eb" },
  { name: "Commercial", emoji: "🚢", color: "#0891b2" },
  { name: "Fish Vendor", emoji: "🐟", color: "#059669" },
  { name: "Aquaculture", emoji: "🦐", color: "#7c3aed" },
  { name: "Gleaner", emoji: "🐚", color: "#d97706" },
  { name: "Fish Processor", emoji: "🏭", color: "#dc2626" },
  { name: "Bantay Dagat Volunteer", emoji: "🛟", color: "#0284c7" },
  { name: "Senior Fisherfolk", emoji: "👴", color: "#65a30d" },
];

const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "LOGIN",
  "PRINT",
  "VIOLATION_FILED",
  "EXPORT",
  "MEDIA_DOWNLOAD",
] as const;

const EDIT_FIELD_POOL: Array<{ field: string; from: () => string; to: () => string }> = [
  { field: "contactNumber", from: () => `09${randInt(100000000, 999999999)}`, to: () => `09${randInt(100000000, 999999999)}` },
  { field: "address", from: () => "Purok 1, Old Address", to: () => "Purok 2, Updated Address" },
  { field: "civilStatus", from: () => "SINGLE", to: () => "MARRIED" },
  { field: "emergencyContactName", from: () => "Juan Dela Cruz", to: () => "Maria Dela Cruz" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      throw new Error(
        `Tenant not found: "${tenantSlug}". Run the demo-tenant provisioning script first (it must create the tenant, its fisherfolk, and its users before this script runs).`,
      );
    }
    const tenantId = tenant.id;

    const users = await prisma.user.findMany({ where: { tenantId }, select: { id: true, role: true } });
    if (users.length === 0) {
      throw new Error(`No users found for tenant "${tenantSlug}" — cannot attribute demo records.`);
    }
    const actor =
      users.find((u) => u.role === "tenant_manager" || u.role === "tenant_superadmin") ?? users[0]!;
    const userIds = users.map((u) => u.id);

    const ff = await prisma.fisherfolk.findMany({
      where: { tenantId },
      select: { id: true },
      take: 1000,
      orderBy: { idNumber: "asc" },
    });
    if (ff.length === 0) {
      throw new Error(`No fisherfolk found for tenant "${tenantSlug}" — seed the demo fisherfolk first.`);
    }
    const ffIds = ff.map((f) => f.id);
    console.log(`ℹ  Tenant ${tenantSlug}: ${ffIds.length} fisherfolk, ${userIds.length} users available.`);

    // ── 1. FishCatch + FishCatchSpecies ────────────────────────────────────────
    let fishCatchCreated = 0;
    let speciesCreated = 0;
    for (let i = 1; i <= N_FISH_CATCHES; i++) {
      const referenceNo = `DEMO-FC-${String(i).padStart(4, "0")}`;
      const existing = await prisma.fishCatch.findUnique({
        where: { tenantId_referenceNo: { tenantId, referenceNo } },
        select: { id: true },
      });
      if (existing) continue;

      const gearType = pick(GEAR_TYPES);
      const totalCatchKg = Number((randInt(50, 4000) / 10).toFixed(2));
      const fishCatch = await prisma.fishCatch.create({
        data: {
          tenantId,
          referenceNo,
          fisherfolkId: pick(ffIds),
          landingDate: randDate(365),
          gearType,
          totalCatchKg,
          numTrips: randInt(1, 5),
          source: "FMO_ENUMERATOR",
          createdById: actor.id,
        },
        select: { id: true },
      });
      fishCatchCreated++;

      const numSpecies = randInt(1, 3);
      const usedNames = new Set<string>();
      for (let s = 0; s < numSpecies; s++) {
        let commonName = pick(PH_FISH_SPECIES);
        let attempts = 0;
        while (usedNames.has(commonName) && attempts < 5) {
          commonName = pick(PH_FISH_SPECIES);
          attempts++;
        }
        usedNames.add(commonName);
        await prisma.fishCatchSpecies.create({
          data: {
            tenantId,
            fishCatchId: fishCatch.id,
            commonName,
            weightKg: Number((randInt(5, 500) / 10).toFixed(2)),
          },
        });
        speciesCreated++;
      }
    }
    console.log(`✅  FishCatch: ${fishCatchCreated} created (${speciesCreated} species rows), target ${N_FISH_CATCHES}.`);

    // ── 2. Notification ─────────────────────────────────────────────────────────
    const existingNotifCount = await prisma.notification.count({ where: { tenantId } });
    let notifCreated = 0;
    for (let i = existingNotifCount; i < N_NOTIFICATIONS; i++) {
      const def = pick(NOTIFICATION_MESSAGES);
      await prisma.notification.create({
        data: {
          tenantId,
          userId: pick(userIds),
          type: def.type,
          title: def.title,
          message: def.message,
          isRead: rng() < 0.5,
        },
      });
      notifCreated++;
    }
    console.log(`✅  Notification: ${notifCreated} created, target ${N_NOTIFICATIONS}.`);
    void NOTIFICATION_TYPES; // referenced for type completeness of the enum import

    // ── 3. EditRequest ───────────────────────────────────────────────────────────
    const existingEditReqCount = await prisma.editRequest.count({ where: { tenantId } });
    let editReqCreated = 0;
    const EDIT_STATUSES: EditRequestStatus[] = ["PENDING", "APPROVED", "REJECTED"];
    for (let i = existingEditReqCount; i < N_EDIT_REQUESTS; i++) {
      const field = pick(EDIT_FIELD_POOL);
      const status = pick(EDIT_STATUSES);
      const isReviewed = status !== "PENDING";
      await prisma.editRequest.create({
        data: {
          tenantId,
          fisherfolkId: pick(ffIds),
          requestedById: pick(userIds),
          fieldChanges: { [field.field]: { from: field.from(), to: field.to() } },
          status,
          ...(isReviewed
            ? {
                reviewedById: actor.id,
                reviewedAt: new Date(),
                ...(status === "REJECTED" ? { rejectionReason: "Insufficient supporting documentation." } : {}),
              }
            : {}),
        },
      });
      editReqCreated++;
    }
    console.log(`✅  EditRequest: ${editReqCreated} created, target ${N_EDIT_REQUESTS}.`);

    // ── 4. Category ──────────────────────────────────────────────────────────────
    let categoryCreated = 0;
    for (let i = 0; i < CATEGORY_DEFS.length; i++) {
      const c = CATEGORY_DEFS[i]!;
      const slug = slugify(c.name);
      const upserted = await prisma.category.upsert({
        where: { tenantId_slug: { tenantId, slug } },
        update: {},
        create: {
          tenantId,
          name: c.name,
          slug,
          displayColor: c.color,
          iconType: "EMOJI",
          iconEmoji: c.emoji,
          displayOrder: i,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      if (upserted) categoryCreated++;
    }
    console.log(`✅  Category: ${categoryCreated} ensured (${CATEGORY_DEFS.length} defs).`);

    // ── 5. IDTemplate ────────────────────────────────────────────────────────────
    const idTemplateDefs: Array<{ name: string; templateType: "FISHERFOLK" | "VESSEL" }> = [
      { name: "Standard Fisherfolk ID (Demo)", templateType: "FISHERFOLK" },
      { name: "Standard Vessel ID (Demo)", templateType: "VESSEL" },
    ];
    const idTemplateIds: string[] = [];
    let idTemplateCreated = 0;
    for (const def of idTemplateDefs) {
      let tpl = await prisma.iDTemplate.findFirst({ where: { tenantId, name: def.name } });
      if (!tpl) {
        tpl = await prisma.iDTemplate.create({
          data: {
            tenantId,
            name: def.name,
            templateType: def.templateType,
            frontElements: {},
            backElements: {},
            status: "ACTIVE",
            createdById: actor.id,
          },
        });
        idTemplateCreated++;
      }
      idTemplateIds.push(tpl.id);
    }
    console.log(`✅  IDTemplate: ${idTemplateCreated} created (${idTemplateIds.length} total ensured).`);

    // ── 6. AuditLog ──────────────────────────────────────────────────────────────
    const existingAuditCount = await prisma.auditLog.count({ where: { tenantId } });
    let auditCreated = 0;
    for (let i = existingAuditCount; i < N_AUDIT_LOGS; i++) {
      const action = pick(AUDIT_ACTIONS);
      const entityType = pick(["Fisherfolk", "Vessel", "Violation", "AyudaProgram", "FishCatch"] as const);
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: pick(userIds),
          action,
          entityType,
          entityId: pick(ffIds),
          createdAt: randDate(180),
        },
      });
      auditCreated++;
    }
    console.log(`✅  AuditLog: ${auditCreated} created, target ${N_AUDIT_LOGS}.`);

    // ── 7. RegistrationRenewal ───────────────────────────────────────────────────
    const currentYear = new Date().getFullYear();
    let renewalCreated = 0;
    let renewalAttempts = 0;
    const shuffledFf = [...ffIds];
    for (let i = renewalAttempts; renewalCreated < N_RENEWALS && renewalAttempts < shuffledFf.length; renewalAttempts++) {
      const fisherfolkId = shuffledFf[renewalAttempts]!;
      const renewalYear = currentYear - randInt(0, 2);
      const existing = await prisma.registrationRenewal.findUnique({
        where: { fisherfolkId_renewalYear: { fisherfolkId, renewalYear } },
        select: { id: true },
      });
      if (existing) continue;
      await prisma.registrationRenewal.create({
        data: {
          tenantId,
          fisherfolkId,
          renewalYear,
          renewedById: actor.id,
        },
      });
      renewalCreated++;
    }
    console.log(`✅  RegistrationRenewal: ${renewalCreated} created, target ${N_RENEWALS}.`);

    // ── 8. ImportBatch ───────────────────────────────────────────────────────────
    const importBatchDefs = [
      { fileName: "demo-masterlist-2026-01.csv", status: "COMPLETED" as const, mode: "FULL" as const, totalRows: 500, validRows: 480, warningRows: 15, errorRows: 5, importedRows: 480, skippedRows: 20 },
      { fileName: "demo-masterlist-2026-04.csv", status: "COMPLETED" as const, mode: "INCREMENTAL" as const, totalRows: 60, validRows: 58, warningRows: 2, errorRows: 0, importedRows: 58, skippedRows: 2 },
      { fileName: "demo-masterlist-2026-07.csv", status: "FAILED" as const, mode: "INCREMENTAL" as const, totalRows: 30, validRows: 12, warningRows: 3, errorRows: 15, importedRows: 0, skippedRows: 30 },
    ];
    const existingImportCount = await prisma.importBatch.count({ where: { tenantId } });
    let importBatchCreated = 0;
    for (let i = existingImportCount; i < importBatchDefs.length; i++) {
      const def = importBatchDefs[i]!;
      await prisma.importBatch.create({
        data: {
          tenantId,
          mode: def.mode,
          status: def.status,
          fileName: def.fileName,
          totalRows: def.totalRows,
          validRows: def.validRows,
          warningRows: def.warningRows,
          errorRows: def.errorRows,
          importedRows: def.importedRows,
          skippedRows: def.skippedRows,
          createdById: actor.id,
          completedAt: def.status === "COMPLETED" || def.status === "FAILED" ? randDate(120) : null,
        },
      });
      importBatchCreated++;
    }
    console.log(`✅  ImportBatch: ${importBatchCreated} created, target ${importBatchDefs.length}.`);

    // ── 9. IDPrintBatch ──────────────────────────────────────────────────────────
    const existingPrintBatchCount = await prisma.iDPrintBatch.count({ where: { tenantId } });
    const N_PRINT_BATCHES = 2;
    let printBatchCreated = 0;
    if (idTemplateIds.length > 0) {
      for (let i = existingPrintBatchCount; i < N_PRINT_BATCHES; i++) {
        const templateId = idTemplateIds[i % idTemplateIds.length]!;
        const template = await prisma.iDTemplate.findUnique({ where: { id: templateId }, select: { templateType: true } });
        if (!template) continue;
        const idCount = randInt(10, 60);
        await prisma.iDPrintBatch.create({
          data: {
            tenantId,
            templateId,
            templateType: template.templateType,
            printedById: actor.id,
            idCount,
            summaryJson: { printed: idCount, failed: 0 },
          },
        });
        printBatchCreated++;
      }
    } else {
      console.warn("⚠  IDPrintBatch: skipped — no IDTemplate available to reference.");
    }
    console.log(`✅  IDPrintBatch: ${printBatchCreated} created, target ${N_PRINT_BATCHES}.`);

    console.log("\n🎉  Demo long-tail extras seed complete. Summary:");
    console.log(`   FishCatch: ${fishCatchCreated} (+${speciesCreated} species)`);
    console.log(`   Notification: ${notifCreated}`);
    console.log(`   EditRequest: ${editReqCreated}`);
    console.log(`   Category: ${categoryCreated}`);
    console.log(`   IDTemplate: ${idTemplateCreated}`);
    console.log(`   AuditLog: ${auditCreated}`);
    console.log(`   RegistrationRenewal: ${renewalCreated}`);
    console.log(`   ImportBatch: ${importBatchCreated}`);
    console.log(`   IDPrintBatch: ${printBatchCreated}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌  seed-demo-calapan-extras failed:", err);
  process.exit(1);
});
