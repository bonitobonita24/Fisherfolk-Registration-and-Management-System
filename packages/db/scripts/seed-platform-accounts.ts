/**
 * seed-platform-accounts.ts — SCOPED, IDEMPOTENT seed of ONLY the platform
 * staff accounts (Site Access & Tenancy Bootstrap Standard §2).
 *
 * Creates / corrects, and NOTHING ELSE:
 *   - the `tm` platform tenant (FK target for the accounts below);
 *   - the BILLING scope='platform' CustomRole + its `billing` grant;
 *   - the TECH SUPPORT scope='platform' CustomRole + `data_overrides` +
 *     `tech_support` grants;
 *   - the `tenantbilling@…` and `tenanttech@…` platform users
 *     (`role = tenant_manager`, bound to their curated CustomRole).
 *
 * WHY THIS EXISTS: prod + demo are RESEED-NEVER, so `prisma/seed.ts` never
 * runs there and these accounts are absent — the `/tm` BILLING/TECH logins
 * don't work live. This lifts ONLY the platform-account blocks from
 * `prisma/seed.ts` (byte-faithful, same idempotent upsert pattern) so they
 * can be applied to a live DB without touching any tenant/LGU/demo data.
 *
 * SAFETY:
 *   - Every write is an upsert / findFirst+create — safe to re-run; a drifted
 *     row is corrected, never duplicated.
 *   - It creates NO fisherfolk / vessels / LGU tenant / demo data.
 *   - Passwords come ONLY from env (TENANTBILLING_PASSWORD / TENANTTECH_PASSWORD),
 *     injected from the vault at runtime. The script HARD-REFUSES to run if a
 *     password is missing or is a known dev-default literal, so a live DB can
 *     never receive the throwaway dev password.
 *
 * RUN (against a live DB via an SSH tunnel or a remote DATABASE_URL):
 *   DATABASE_URL=… \
 *   TENANTBILLING_PASSWORD=… TENANTTECH_PASSWORD=… \
 *   pnpm --filter @frms/db exec tsx scripts/seed-platform-accounts.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Dev-default password literals from prisma/seed.ts — NEVER allowed live. */
const DEV_DEFAULTS = new Set([
  "Billing_LocalDevOnly_ChangeMe",
  "Tech_LocalDevOnly_ChangeMe",
]);

function requireRealPassword(envVar: string): string {
  const value = process.env[envVar];
  if (!value || value.trim() === "") {
    throw new Error(
      `${envVar} is required (inject the vault password) — refusing to seed a live account without it.`,
    );
  }
  if (DEV_DEFAULTS.has(value)) {
    throw new Error(
      `${envVar} is the dev-default placeholder — refusing to seed a live account with it. Inject the real vault password.`,
    );
  }
  return value;
}

async function main() {
  // Fail-fast BEFORE any DB write if the real passwords aren't provided.
  const tenantBillingPassword = requireRealPassword("TENANTBILLING_PASSWORD");
  const tenantTechPassword = requireRealPassword("TENANTTECH_PASSWORD");

  // ── `tm` platform tenant (FK target) ───────────────────────────────────────
  const platformTenant = await prisma.tenant.upsert({
    where: { slug: "tm" },
    update: {},
    create: {
      name: "Powerbyte Platform Administration",
      slug: "tm",
      accentColor: "#4F8EF7",
      currentRegistrationYear: new Date().getFullYear(),
      barangayList: [],
      violationSubjects: [],
      status: "ACTIVE",
    },
  });
  console.log(`  ✅ Platform tenant ready: ${platformTenant.slug}`);

  // ── Platform-scope CustomRoles (tenantId null → findFirst + create/update) ──
  async function upsertPlatformRole(name: string, description: string) {
    const existing = await prisma.customRole.findFirst({
      where: { scope: "platform", name },
    });
    if (existing) {
      return prisma.customRole.update({
        where: { id: existing.id },
        data: { isActive: true, description },
      });
    }
    return prisma.customRole.create({
      data: { tenantId: null, scope: "platform", name, description, isActive: true },
    });
  }

  const billingRole = await upsertPlatformRole(
    "BILLING",
    "Platform billing operations only — no tenant management or tech support access.",
  );
  const techSupportRole = await upsertPlatformRole(
    "TECH SUPPORT",
    "Platform data-override + tech-support tooling — no billing or tenant management access.",
  );
  console.log(`  ✅ Platform CustomRole "BILLING" ready: ${billingRole.id}`);
  console.log(`  ✅ Platform CustomRole "TECH SUPPORT" ready: ${techSupportRole.id}`);

  // ── Grants (upsert intended keys, deleteMany strays — converges exactly) ────
  const fullGrant = { view: true, write: true, update: true, delete: true };

  await prisma.platformRolePermission.upsert({
    where: { roleId_permissionKey: { roleId: billingRole.id, permissionKey: "billing" } },
    update: fullGrant,
    create: { roleId: billingRole.id, permissionKey: "billing", ...fullGrant },
  });
  await prisma.platformRolePermission.deleteMany({
    where: {
      roleId: billingRole.id,
      permissionKey: { in: ["tenant_management", "data_overrides", "tech_support"] },
    },
  });

  for (const permissionKey of ["data_overrides", "tech_support"] as const) {
    await prisma.platformRolePermission.upsert({
      where: { roleId_permissionKey: { roleId: techSupportRole.id, permissionKey } },
      update: fullGrant,
      create: { roleId: techSupportRole.id, permissionKey, ...fullGrant },
    });
  }
  await prisma.platformRolePermission.deleteMany({
    where: {
      roleId: techSupportRole.id,
      permissionKey: { in: ["billing", "tenant_management"] },
    },
  });
  console.log(
    `  ✅ Platform role permissions granted (BILLING: billing; TECH SUPPORT: data_overrides+tech_support)`,
  );

  // ── Platform users (role tenant_manager, bound to their curated role) ───────
  const tenantBillingUsername =
    process.env["TENANTBILLING_USERNAME"] ?? "tenantbilling@powerbyteitsolutions.com";
  const tenantBillingEmail = process.env["TENANTBILLING_EMAIL"] ?? tenantBillingUsername;
  const tenantBillingName = process.env["TENANTBILLING_NAME"] ?? "Platform Billing";
  const tenantBillingHash = await bcrypt.hash(tenantBillingPassword, 12);

  const tenantBilling = await prisma.user.upsert({
    where: { tenantId_email: { email: tenantBillingEmail, tenantId: platformTenant.id } },
    update: {
      username: tenantBillingUsername,
      passwordHash: tenantBillingHash,
      role: "tenant_manager",
      name: tenantBillingName,
      customRoleId: billingRole.id,
      status: "ACTIVE",
    },
    create: {
      tenantId: platformTenant.id,
      email: tenantBillingEmail,
      username: tenantBillingUsername,
      passwordHash: tenantBillingHash,
      name: tenantBillingName,
      role: "tenant_manager",
      customRoleId: billingRole.id,
      securityVersion: 1,
      status: "ACTIVE",
    },
  });
  console.log(`  ✅ Platform BILLING account ready: ${tenantBilling.username}`);

  const tenantTechUsername =
    process.env["TENANTTECH_USERNAME"] ?? "tenanttech@powerbyteitsolutions.com";
  const tenantTechEmail = process.env["TENANTTECH_EMAIL"] ?? tenantTechUsername;
  const tenantTechName = process.env["TENANTTECH_NAME"] ?? "Platform Tech Support";
  const tenantTechHash = await bcrypt.hash(tenantTechPassword, 12);

  const tenantTech = await prisma.user.upsert({
    where: { tenantId_email: { email: tenantTechEmail, tenantId: platformTenant.id } },
    update: {
      username: tenantTechUsername,
      passwordHash: tenantTechHash,
      role: "tenant_manager",
      name: tenantTechName,
      customRoleId: techSupportRole.id,
      status: "ACTIVE",
    },
    create: {
      tenantId: platformTenant.id,
      email: tenantTechEmail,
      username: tenantTechUsername,
      passwordHash: tenantTechHash,
      name: tenantTechName,
      role: "tenant_manager",
      customRoleId: techSupportRole.id,
      securityVersion: 1,
      status: "ACTIVE",
    },
  });
  console.log(`  ✅ Platform TECH SUPPORT account ready: ${tenantTech.username}`);

  console.log("\n✅ Scoped platform-account seed complete (no tenant/LGU/demo data touched).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
