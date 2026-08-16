import { FeatureKey, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Custom-role permission-matrix feature registry (PD-005 Chunk 1).
 * See ~/.claude/rules/tenant-rbac-standard.md §4.
 *
 * The standard allows the feature registry to be either a DB table or a
 * compile-time enum — here it is the Prisma `FeatureKey` enum itself, so
 * there are no rows to insert. This "seed" step is therefore a NO-OP
 * verification, not a write: it asserts the registry is exactly the expected
 * FRMS feature set and — the structural guardrail — that `billing` and
 * `user_management` can never appear (those permissions are exclusive to the
 * fixed tenant_superadmin / tenant_manager tiers, never a custom role).
 * Running this twice is a pure read + assert, so it is trivially idempotent.
 */
function verifyFeatureRegistry(): void {
  const expected = [
    "fisherfolk",
    "households",
    "vessels",
    "fish_catches",
    "violations",
    "ayuda",
    "edit_requests",
    "kanban",
    "reports",
    "analytics",
    "map",
    "notifications",
    "id_generator",
    "import",
    "audit_log",
    "data_management",
  ].sort();
  // Widen to string[] for the guardrail check below — TS already proves
  // "billing"/"user_management" aren't valid FeatureKey members at compile
  // time; the runtime check guards against a future enum edit reintroducing
  // them without updating this registry's expected list.
  const actual: string[] = Object.values(FeatureKey).sort();

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `FeatureKey registry drift detected — expected [${expected.join(", ")}] but got [${actual.join(", ")}]`,
    );
  }
  if (actual.includes("billing") || actual.includes("user_management")) {
    throw new Error(
      "FeatureKey registry violates the RBAC guardrail: billing/user_management must never be gateable.",
    );
  }
  console.log(`  ✅ FeatureKey registry verified (${actual.length} features, no billing/user_management)`);
}

async function main() {
  console.log("🌱 Seeding database...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "calapan-city" },
    update: {},
    create: {
      name: "City of Calapan - Fisheries Management Office",
      slug: "calapan-city",
      mayorName: null,
      mayorSignatureUrl: null,
      logoUrl: null,
      accentColor: "#4F8EF7",
      smtpHost: null,
      smtpPort: null,
      smtpUser: null,
      smtpPassword: null,
      smtpFrom: null,
      currentRegistrationYear: new Date().getFullYear(),
      barangayList: [
        "Barangay 1",
        "Barangay 2",
        "Barangay 3",
        "Barangay 4",
        "Barangay 5",
        "Barangay 6",
        "Barangay 7",
        "Barangay 8",
        "Barangay 9",
        "Barangay 10",
        "Barangay 11",
        "Barangay 12",
        "Guinobatan",
        "Lumangbayan",
        "Mahal na Pangalan",
        "Malad",
        "Masipit",
        "Nag-iba I",
        "Nag-iba II",
        "Navotas",
        "Pachoca",
        "Palhi",
        "Panggalaan",
        "Parang",
        "Patas",
        "Personas",
        "Putingtubig",
        "Salong",
        "Silonay",
        "Suqui",
        "Tawiran",
        "Tibag",
        "Wawa",
      ],
      violationSubjects: [
        "Illegal Fishing",
        "No Municipal Fishing License",
        "Fishing in Restricted Zone",
        "Use of Fine Mesh Net",
        "Dynamite Fishing",
        "Cyanide Fishing",
        "Unauthorized Commercial Fishing",
        "Violation of Closed Season",
        "Unregistered Vessel",
        "Operating Without Boat License",
      ],
      status: "ACTIVE",
    },
  });

  console.log(`  ✅ Tenant created: ${tenant.name} (${tenant.slug})`);

  // Dedicated platform tenant — owns the tenant-manager (super_admin) account
  // so the platform manager never appears in an LGU tenant's staff list. It is
  // invisible to the client (they only ever see their own LGU app, never
  // /tm). Owner-set 2026-07-09; slug renamed platform→tm (Milestone 3 — site
  // access & tenancy standard, /platform route retired to a redirect shim).
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

  // ── Accounts (3-tier RBAC — owner-set 2026-07-10) ──────────────────────────
  //  • TENANT SUPERADMIN (webmaster) → role `tenant_superadmin`, belongs to the
  //    LGU tenant. Runs the FRMS app; has NO /tm access. Identity is
  //    env-driven via the SUPERADMIN_* vars (historical name kept to avoid
  //    churn) — staging/prod inject the universal owner-admin cred; local dev
  //    falls back to the documented localhost cred.
  //  • TENANT MANAGER (tenantadmin) → role `tenant_manager`, belongs to the
  //    `tm` tenant. The SOLE platform/tenant manager (/tm/tenants).
  //    Identity is env-driven via TENANTADMIN_*. The real prod-grade password
  //    lives ONLY in the gitignored .env.* — the default literal below is a
  //    throwaway local placeholder, never the real secret.
  //  • TENANT ADMIN (admin) → role `tenant_admin`, belongs to the LGU tenant.
  //    First child admin under the tenant superadmin — no Billing/User-Mgmt.
  //    Identity is env-driven via SEED_TENANT_ADMIN_* (same pattern as the
  //    other two accounts); local dev falls back to a dev-only placeholder.
  //  All three upserts set `role` on UPDATE so existing rows are corrected on reseed.

  // Tenant superadmin (LGU) — role `tenant_superadmin`
  const appAdminUsername = process.env["SUPERADMIN_USERNAME"] ?? "webmaster@localhost.com";
  const appAdminEmail = process.env["SUPERADMIN_EMAIL"] ?? appAdminUsername;
  const appAdminPassword = process.env["SUPERADMIN_PASSWORD"] ?? "C^@F/2#mx5eW";
  const appAdminName = process.env["SUPERADMIN_NAME"] ?? "System Administrator";
  const appAdminHash = await bcrypt.hash(appAdminPassword, 12);

  const webmaster = await prisma.user.upsert({
    where: { tenantId_email: { email: appAdminEmail, tenantId: tenant.id } },
    update: {
      username: appAdminUsername,
      passwordHash: appAdminHash,
      role: "tenant_superadmin",
      name: appAdminName,
      status: "ACTIVE",
    },
    create: {
      tenantId: tenant.id,
      email: appAdminEmail,
      username: appAdminUsername,
      passwordHash: appAdminHash,
      name: appAdminName,
      role: "tenant_superadmin",
      securityVersion: 1,
      status: "ACTIVE",
    },
  });

  console.log(`  ✅ Tenant superadmin (role=tenant_superadmin) ready: ${webmaster.username}`);

  // Tenant manager (platform) — role `tenant_manager`
  const tenantAdminUsername = process.env["TENANTADMIN_USERNAME"] ?? "tenantadmin@localhost.com";
  const tenantAdminEmail = process.env["TENANTADMIN_EMAIL"] ?? tenantAdminUsername;
  const tenantAdminPassword = process.env["TENANTADMIN_PASSWORD"] ?? "TenantAdmin_LocalDevOnly_ChangeMe";
  const tenantAdminName = process.env["TENANTADMIN_NAME"] ?? "Tenant Manager";
  const tenantAdminHash = await bcrypt.hash(tenantAdminPassword, 12);

  const tenantAdmin = await prisma.user.upsert({
    where: { tenantId_email: { email: tenantAdminEmail, tenantId: platformTenant.id } },
    update: {
      username: tenantAdminUsername,
      passwordHash: tenantAdminHash,
      role: "tenant_manager",
      name: tenantAdminName,
      status: "ACTIVE",
    },
    create: {
      tenantId: platformTenant.id,
      email: tenantAdminEmail,
      username: tenantAdminUsername,
      passwordHash: tenantAdminHash,
      name: tenantAdminName,
      role: "tenant_manager",
      securityVersion: 1,
      status: "ACTIVE",
    },
  });

  console.log(`  ✅ Tenant manager (role=tenant_manager) ready: ${tenantAdmin.username}`);

  // Tenant admin (LGU) — role `tenant_admin`
  const lguAdminUsername = process.env["SEED_TENANT_ADMIN_USERNAME"] ?? "admin";
  const lguAdminEmail = process.env["SEED_TENANT_ADMIN_EMAIL"] ?? "admin@admin.com";
  const lguAdminPassword = process.env["SEED_TENANT_ADMIN_PASSWORD"] ?? "TenantAdmin_LocalDevOnly_ChangeMe";
  const lguAdminName = process.env["SEED_TENANT_ADMIN_NAME"] ?? "LGU Admin";
  const lguAdminHash = await bcrypt.hash(lguAdminPassword, 12);

  const lguAdmin = await prisma.user.upsert({
    where: { tenantId_email: { email: lguAdminEmail, tenantId: tenant.id } },
    update: {
      username: lguAdminUsername,
      passwordHash: lguAdminHash,
      role: "tenant_admin",
      name: lguAdminName,
      status: "ACTIVE",
    },
    create: {
      tenantId: tenant.id,
      email: lguAdminEmail,
      username: lguAdminUsername,
      passwordHash: lguAdminHash,
      name: lguAdminName,
      role: "tenant_admin",
      securityVersion: 1,
      status: "ACTIVE",
    },
  });

  console.log(`  ✅ Tenant admin (role=tenant_admin) ready: ${lguAdmin.username}`);

  const defaultCategories = [
    { name: "Boat Owner/Operator", slug: "boat-owner-operator", description: "Owner or operator of a registered fishing vessel", displayOrder: 1 },
    { name: "Capture Fishing", slug: "capture-fishing", description: "Engaged in municipal capture fishing", displayOrder: 2 },
    { name: "Gleaning", slug: "gleaning", description: "Engaged in gleaning of shells/marine organisms", displayOrder: 3 },
    { name: "Vendor", slug: "vendor", description: "Fish vendor or trader", displayOrder: 4 },
    { name: "Fish Processing", slug: "fish-processing", description: "Engaged in fish processing", displayOrder: 5 },
    { name: "Aquaculture", slug: "aquaculture", description: "Engaged in aquaculture/fish farming", displayOrder: 6 },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: {
        tenantId_slug: {
          slug: cat.slug,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        displayColor: "#4F8EF7",
        iconType: "EMOJI",
        iconEmoji: "🐟",
        displayOrder: cat.displayOrder,
        status: "ACTIVE",
      },
    });
  }

  console.log(`  ✅ ${defaultCategories.length} default categories created`);

  // Barangay aliases — canonical name-merge rules used by import normalization (typoMap).
  // Seeded so they survive a DB reset (previously created only via Settings CRUD and lost
  // in a crash-reset). "San Rafael" is the former name of Salong (FMO-confirmed 2026-08-04).
  const barangayAliases = [{ fromLabel: "San Rafael", toLabel: "Salong" }];

  for (const alias of barangayAliases) {
    await prisma.barangayAlias.upsert({
      where: {
        tenantId_fromLabel: { tenantId: tenant.id, fromLabel: alias.fromLabel },
      },
      update: { toLabel: alias.toLabel },
      create: {
        tenantId: tenant.id,
        fromLabel: alias.fromLabel,
        toLabel: alias.toLabel,
      },
    });
  }

  console.log(`  ✅ ${barangayAliases.length} barangay alias(es) created`);

  verifyFeatureRegistry();

  console.log("\n✅ Seed complete!");
  console.log(`   Tenant superadmin:        ${appAdminUsername} / [see CREDENTIALS.md]`);
  console.log(`   Tenant manager (platform):${tenantAdminUsername} / [see CREDENTIALS.md]`);
  console.log(`   Tenant admin (LGU):       ${lguAdmin.username} / [see CREDENTIALS.md]`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
