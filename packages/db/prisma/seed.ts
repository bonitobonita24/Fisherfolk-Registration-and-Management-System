import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
        "San Rafael",
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
  // /platform). Owner-set 2026-07-09.
  const platformTenant = await prisma.tenant.upsert({
    where: { slug: "platform" },
    update: {},
    create: {
      name: "Powerbyte Platform Administration",
      slug: "platform",
      accentColor: "#4F8EF7",
      currentRegistrationYear: new Date().getFullYear(),
      barangayList: [],
      violationSubjects: [],
      status: "ACTIVE",
    },
  });

  console.log(`  ✅ Platform tenant ready: ${platformTenant.slug}`);

  // ── Accounts (role split — owner-set 2026-07-09) ──────────────────────────
  //  • APP ADMIN (webmaster) → role `admin`, belongs to the LGU tenant. Runs
  //    the FRMS app; has NO /platform access. Identity is env-driven via the
  //    SUPERADMIN_* vars (historical name kept to avoid churn) — staging/prod
  //    inject the universal owner-admin cred; local dev falls back to the
  //    documented localhost cred.
  //  • TENANT MANAGER (tenantadmin) → role `super_admin`, belongs to the
  //    `platform` tenant. The SOLE platform/tenant manager (/platform/tenants).
  //    Identity is env-driven via TENANTADMIN_*. The real prod-grade password
  //    lives ONLY in the gitignored .env.* — the default literal below is a
  //    throwaway local placeholder, never the real secret.
  //  Both upserts set `role` on UPDATE so existing rows are corrected on reseed.

  // App admin (LGU) — role `admin`
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
      role: "admin",
      name: appAdminName,
      status: "ACTIVE",
    },
    create: {
      tenantId: tenant.id,
      email: appAdminEmail,
      username: appAdminUsername,
      passwordHash: appAdminHash,
      name: appAdminName,
      role: "admin",
      securityVersion: 1,
      status: "ACTIVE",
    },
  });

  console.log(`  ✅ App admin (role=admin) ready: ${webmaster.username}`);

  // Tenant manager (platform) — role `super_admin`
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
      role: "super_admin",
      name: tenantAdminName,
      status: "ACTIVE",
    },
    create: {
      tenantId: platformTenant.id,
      email: tenantAdminEmail,
      username: tenantAdminUsername,
      passwordHash: tenantAdminHash,
      name: tenantAdminName,
      role: "super_admin",
      securityVersion: 1,
      status: "ACTIVE",
    },
  });

  console.log(`  ✅ Tenant manager (role=super_admin) ready: ${tenantAdmin.username}`);

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

  console.log("\n✅ Seed complete!");
  console.log(`   App login (admin):       ${appAdminUsername} / [see CREDENTIALS.md]`);
  console.log(`   Tenant mgr (super_admin): ${tenantAdminUsername} / [see CREDENTIALS.md]`);
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
