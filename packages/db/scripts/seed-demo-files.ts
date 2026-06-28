/**
 * seed-demo-files.ts
 * Idempotent linker: uploads demo assets to storage and creates attachment rows
 * for Violations, Kanban tasks, Ayuda programs, and Vessels that currently have none.
 *
 * Run via:
 *   set -a; . ./.env.dev; set +a
 *   pnpm --filter @frms/db exec tsx scripts/seed-demo-files.ts
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { uploadFile } from "@frms/storage";

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEMO_ASSETS_DIR = path.join(__dirname, "..", "demo-assets");

const prisma = new PrismaClient();

async function up(
  tenantId: string,
  entityType: string,
  file: string,
  mime: string,
): Promise<{ key: string; sizeBytes: number; mimeType: string }> {
  const buffer = fs.readFileSync(path.join(DEMO_ASSETS_DIR, file));
  const r = await uploadFile({ tenantId, entityType, originalFilename: file, mimeType: mime, buffer });
  return { key: r.key, sizeBytes: r.sizeBytes, mimeType: r.mimeType };
}

async function main() {
  // ── 1. Resolve tenant + uploader ──────────────────────────────────────────
  const tenant = await prisma.tenant.findUnique({ where: { slug: "calapan-city" } });
  if (!tenant) throw new Error("Tenant 'calapan-city' not found — run db:seed first.");

  const tenantId = tenant.id;

  const uploader = await prisma.user.findFirst({ where: { tenantId, role: "super_admin" } });
  if (!uploader) throw new Error("No super_admin user found for tenant 'calapan-city'.");

  const uploadedById = uploader.id;

  // ── 2. Violations ─────────────────────────────────────────────────────────
  const violations = await prisma.violation.findMany({
    where: { tenantId, attachments: { none: {} } },
    take: 4,
  });

  let violationCount = 0;
  for (let i = 0; i < violations.length; i++) {
    const v = violations[i];
    const netUpload = await up(tenantId, "violation-evidence", "violation-evidence-net.png", "image/png");
    const pdfUpload = await up(tenantId, "violation-evidence", "violation-report.pdf", "application/pdf");

    const rows = [
      {
        violationId: v.id,
        filePath: netUpload.key,
        originalFilename: "violation-evidence-net.png",
        mimeType: netUpload.mimeType,
        fileSize: netUpload.sizeBytes,
        uploadedById,
      },
      {
        violationId: v.id,
        filePath: pdfUpload.key,
        originalFilename: "violation-report.pdf",
        mimeType: pdfUpload.mimeType,
        fileSize: pdfUpload.sizeBytes,
        uploadedById,
      },
    ];

    // First violation also gets the boat photo
    if (i === 0) {
      const boatUpload = await up(tenantId, "violation-evidence", "violation-evidence-boat.jpg", "image/jpeg");
      rows.push({
        violationId: v.id,
        filePath: boatUpload.key,
        originalFilename: "violation-evidence-boat.jpg",
        mimeType: boatUpload.mimeType,
        fileSize: boatUpload.sizeBytes,
        uploadedById,
      });
    }

    await prisma.violationAttachment.createMany({ data: rows });
    violationCount++;
  }

  // ── 3. Kanban tasks ───────────────────────────────────────────────────────
  const tasks = await prisma.kanbanTask.findMany({
    where: { tenantId, attachments: { none: {} } },
    take: 3,
  });

  let kanbanCount = 0;
  for (const task of tasks) {
    const siteUpload = await up(tenantId, "kanban-attachment", "kanban-attachment-site.png", "image/png");
    const specUpload = await up(tenantId, "kanban-attachment", "kanban-spec.pdf", "application/pdf");

    await prisma.kanbanAttachment.createMany({
      data: [
        {
          taskId: task.id,
          filePath: siteUpload.key,
          originalFilename: "kanban-attachment-site.png",
          mimeType: siteUpload.mimeType,
          fileSize: siteUpload.sizeBytes,
          uploadedById,
        },
        {
          taskId: task.id,
          filePath: specUpload.key,
          originalFilename: "kanban-spec.pdf",
          mimeType: specUpload.mimeType,
          fileSize: specUpload.sizeBytes,
          uploadedById,
        },
      ],
    });
    kanbanCount++;
  }

  // ── 4. Ayuda programs ─────────────────────────────────────────────────────
  const programs = await prisma.ayudaProgram.findMany({
    where: { tenantId, uploads: { none: {} } },
    take: 3,
  });

  let ayudaCount = 0;
  for (const prog of programs) {
    const photoUpload = await up(tenantId, "ayuda-upload", "ayuda-event-photo.png", "image/png");
    const sheetUpload = await up(tenantId, "ayuda-upload", "ayuda-signed-sheet.pdf", "application/pdf");

    await prisma.ayudaUpload.createMany({
      data: [
        {
          programId: prog.id,
          uploadType: "EVENT_PHOTO",
          filePath: photoUpload.key,
          originalFilename: "ayuda-event-photo.png",
          mimeType: photoUpload.mimeType,
          fileSize: photoUpload.sizeBytes,
          uploadedById,
        },
        {
          programId: prog.id,
          uploadType: "DOCUMENT",
          filePath: sheetUpload.key,
          originalFilename: "ayuda-signed-sheet.pdf",
          mimeType: sheetUpload.mimeType,
          fileSize: sheetUpload.sizeBytes,
          uploadedById,
        },
      ],
    });
    ayudaCount++;
  }

  // ── 5. Vessels ────────────────────────────────────────────────────────────
  const vessels = await prisma.vessel.findMany({
    where: { tenantId, vesselPhoto: null },
    take: 6,
  });

  let vesselCount = 0;
  for (const vessel of vessels) {
    const photoUpload = await up(tenantId, "vessel-photo", "vessel-photo-bangka.png", "image/png");
    await prisma.vessel.update({
      where: { id: vessel.id },
      data: { vesselPhoto: photoUpload.key },
    });
    vesselCount++;
  }

  // ── 6. Summary ────────────────────────────────────────────────────────────
  console.log("✅ seed-demo-files complete:");
  console.log(`   violations linked : ${violationCount}`);
  console.log(`   kanban tasks linked: ${kanbanCount}`);
  console.log(`   ayuda programs linked: ${ayudaCount}`);
  console.log(`   vessels photo-linked: ${vesselCount}`);
}

main()
  .catch((err) => {
    console.error("seed-demo-files failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
