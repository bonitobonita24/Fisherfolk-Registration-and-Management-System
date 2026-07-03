/**
 * seed-qa-demo.ts — DEV-ONLY QA seed: non-admin (encoder) login + demo
 * fisherfolk with real photos in MinIO, so RBAC gating and the photo /
 * ID-card flows can be exercised against real data.
 *
 * Creates (idempotent — safe to re-run):
 *   1. An `encoder`-role user (the non-admin staff role) with known dev
 *      credentials, tenant-scoped, ACTIVE, bcrypt(12) hash — same as the
 *      app's Credentials authorize (`bcrypt.compare`).
 *   2. Four demo fisherfolk (`DEMO-QA-0001` … `DEMO-QA-0004`) with
 *      placeholder portrait JPEGs uploaded to the app's storage bucket via
 *      `@frms/storage.uploadFile` (same `{tenantId}/fisherfolk-photo/{rand}.jpg`
 *      key convention the upload router uses). Two of them also get a
 *      `fisherfolk-signature` upload, enough to exercise ID-card generation.
 *
 * HARD DEV GUARD — refuses to run when NODE_ENV=production or when
 * DATABASE_URL does not point at localhost/127.0.0.1. There is no override.
 *
 * Run (from repo root):
 *   set -a; . ./.env.dev; set +a
 *   pnpm --filter @frms/db run db:seed-qa
 *
 * Encoder password: QA_ENCODER_PASSWORD env var, default "EncoderQA!2026-dev".
 * All rows are marked DEMO-QA so they can be purged later.
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { uploadFile, fileExists } from "@frms/storage";

// ── HARD DEV GUARD ───────────────────────────────────────────────────────────
const dbUrl = process.env["DATABASE_URL"] ?? "";
if (process.env["NODE_ENV"] === "production") {
  console.error("❌ REFUSED: NODE_ENV=production — seed-qa-demo is dev-only.");
  process.exit(1);
}
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(dbUrl)) {
  console.error(
    "❌ REFUSED: DATABASE_URL does not point at localhost/127.0.0.1 — seed-qa-demo is dev-only.",
  );
  console.error("   (load ./.env.dev first: set -a; . ./.env.dev; set +a)");
  process.exit(1);
}

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEMO_ASSETS_DIR = path.join(__dirname, "..", "demo-assets");

const TENANT_SLUG =
  process.argv.includes("--tenant")
    ? process.argv[process.argv.indexOf("--tenant") + 1]!
    : "calapan-city";

const ENCODER_EMAIL = "encoder@frms.local";
const ENCODER_USERNAME = "encoder";
const ENCODER_PASSWORD =
  process.env["QA_ENCODER_PASSWORD"] ?? "EncoderQA!2026-dev";

const prisma = new PrismaClient();

interface DemoFisherfolk {
  idNumber: string;
  lastName: string;
  firstName: string;
  middleName: string;
  barangay: string;
  address: string;
  sex: "MALE" | "FEMALE";
  civilStatus: "SINGLE" | "MARRIED" | "WIDOWED" | "SEPARATED" | "DIVORCED";
  dateOfBirth: string; // ISO date
  photoAsset: string;
  signatureAsset?: string;
}

const DEMO_FISHERFOLK: DemoFisherfolk[] = [
  {
    idNumber: "DEMO-QA-0001",
    lastName: "DELACRUZ",
    firstName: "JUAN",
    middleName: "SANTOS",
    barangay: "Suqui",
    address: "Purok 1, Suqui, Calapan City",
    sex: "MALE",
    civilStatus: "MARRIED",
    dateOfBirth: "1980-03-15",
    photoAsset: "qa-fisherfolk-photo-1.jpg",
    signatureAsset: "qa-fisherfolk-signature-1.png",
  },
  {
    idNumber: "DEMO-QA-0002",
    lastName: "REYES",
    firstName: "MARIA",
    middleName: "LOPEZ",
    barangay: "Silonay",
    address: "Sitio Baybay, Silonay, Calapan City",
    sex: "FEMALE",
    civilStatus: "WIDOWED",
    dateOfBirth: "1972-11-02",
    photoAsset: "qa-fisherfolk-photo-2.jpg",
    signatureAsset: "qa-fisherfolk-signature-2.png",
  },
  {
    idNumber: "DEMO-QA-0003",
    lastName: "TOLENTINO",
    firstName: "ANDRES",
    middleName: "BAUTISTA",
    barangay: "San Rafael",
    address: "Purok 3, San Rafael, Calapan City",
    sex: "MALE",
    civilStatus: "SINGLE",
    dateOfBirth: "1995-06-21",
    photoAsset: "qa-fisherfolk-photo-3.jpg",
  },
  {
    idNumber: "DEMO-QA-0004",
    lastName: "PANGILINAN",
    firstName: "LUZVIMINDA",
    middleName: "CRUZ",
    barangay: "Calero",
    address: "Riverside, Calero, Calapan City",
    sex: "FEMALE",
    civilStatus: "MARRIED",
    dateOfBirth: "1988-01-30",
    photoAsset: "qa-fisherfolk-photo-4.jpg",
  },
];

async function uploadAsset(
  tenantId: string,
  entityType: "fisherfolk-photo" | "fisherfolk-signature",
  assetFile: string,
): Promise<string> {
  const buffer = fs.readFileSync(path.join(DEMO_ASSETS_DIR, assetFile));
  const mimeType = assetFile.endsWith(".png") ? "image/png" : "image/jpeg";
  const r = await uploadFile({
    tenantId,
    entityType,
    originalFilename: assetFile,
    mimeType,
    buffer,
  });
  return r.key;
}

async function main() {
  console.log("🌱 Seeding QA demo data (dev-only)...");

  // ── Tenant ────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.findUnique({
    where: { slug: TENANT_SLUG },
  });
  if (!tenant) {
    throw new Error(
      `Tenant "${TENANT_SLUG}" not found — run the base seed first (pnpm --filter @frms/db run db:seed).`,
    );
  }
  console.log(`  ✅ Tenant: ${tenant.name} (${tenant.slug})`);

  // ── 1. Non-admin encoder user ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(ENCODER_PASSWORD, 12);
  const encoder = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: ENCODER_EMAIL },
    },
    // Re-runs reset to a known-good, login-ready state (does NOT touch admin users)
    update: { passwordHash, role: "encoder", status: "ACTIVE" },
    create: {
      tenantId: tenant.id,
      email: ENCODER_EMAIL,
      username: ENCODER_USERNAME,
      passwordHash,
      name: "QA Encoder (Demo)",
      role: "encoder",
      status: "ACTIVE",
      securityVersion: 1,
    },
  });
  console.log(
    `  ✅ Encoder user ready: username="${encoder.username}" role=${encoder.role} (login: username + password + tenant "${tenant.slug}")`,
  );

  // ── 2. Demo fisherfolk with photos ────────────────────────────────────────
  const firstCategory = await prisma.category.findFirst({
    where: { tenantId: tenant.id, status: "ACTIVE" },
    orderBy: { displayOrder: "asc" },
  });
  const categoryIds = firstCategory ? [firstCategory.id] : [];

  let createdCount = 0;
  let photoUploads = 0;
  let signatureUploads = 0;
  const seededKeys: string[] = [];

  for (const ff of DEMO_FISHERFOLK) {
    const fullName = `${ff.lastName}, ${ff.firstName} ${ff.middleName}`;
    const record = await prisma.fisherfolk.upsert({
      where: {
        tenantId_idNumber: { tenantId: tenant.id, idNumber: ff.idNumber },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        idNumber: ff.idNumber,
        fullName,
        lastName: ff.lastName,
        firstName: ff.firstName,
        middleName: ff.middleName,
        dateOfBirth: new Date(ff.dateOfBirth),
        sex: ff.sex,
        civilStatus: ff.civilStatus,
        address: ff.address,
        barangay: ff.barangay,
        contactNumber: "0917-000-0000",
        categoryIds,
        status: "ACTIVE",
        registrationYear: new Date().getFullYear(),
        remarks: "[DEMO-QA] seeded record — safe to delete",
        createdById: encoder.id,
      },
    });
    if (record.remarks?.includes("[DEMO-QA]")) createdCount++;

    // Photo — skip only if the DB key is set AND the object really exists
    const photoOk =
      record.photo !== null &&
      (await fileExists(record.photo, tenant.id));
    if (!photoOk) {
      const key = await uploadAsset(tenant.id, "fisherfolk-photo", ff.photoAsset);
      await prisma.fisherfolk.update({
        where: { id: record.id },
        data: { photo: key },
      });
      photoUploads++;
      seededKeys.push(key);
      console.log(`  📷 ${ff.idNumber} photo → ${key}`);
    } else {
      seededKeys.push(record.photo as string);
      console.log(`  ⏭  ${ff.idNumber} photo already present (${record.photo})`);
    }

    // Signature (subset) — exercises the ID-card back/signature path
    if (ff.signatureAsset) {
      const sigOk =
        record.signature !== null &&
        (await fileExists(record.signature, tenant.id));
      if (!sigOk) {
        const key = await uploadAsset(
          tenant.id,
          "fisherfolk-signature",
          ff.signatureAsset,
        );
        await prisma.fisherfolk.update({
          where: { id: record.id },
          data: { signature: key },
        });
        signatureUploads++;
        console.log(`  ✍️  ${ff.idNumber} signature → ${key}`);
      }
    }
  }

  console.log("\n✅ QA demo seed complete!");
  console.log(`   Encoder login : ${ENCODER_USERNAME} / ${ENCODER_PASSWORD} @ tenant "${tenant.slug}"`);
  console.log(`   Fisherfolk    : ${DEMO_FISHERFOLK.length} DEMO-QA records ensured (${createdCount} marked)`);
  console.log(`   Uploads       : ${photoUploads} photo(s), ${signatureUploads} signature(s) this run`);
  console.log(`   Photo keys    :\n     ${seededKeys.join("\n     ")}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    console.error("❌ QA demo seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
