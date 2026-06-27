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

  const passwordHash = await bcrypt.hash("ipW+3Km/Wh5DSQYjXVQLM9", 12);

  const webmaster = await prisma.user.upsert({
    where: {
      tenantId_email: {
        email: "webmaster@frms.local",
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "webmaster@frms.local",
      username: "webmaster",
      passwordHash,
      name: "System Administrator",
      role: "super_admin",
      securityVersion: 1,
      status: "ACTIVE",
    },
  });

  console.log(`  ✅ Webmaster account created: ${webmaster.email}`);

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
  console.log("   Login: webmaster@frms.local / [see CREDENTIALS.md]");
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
