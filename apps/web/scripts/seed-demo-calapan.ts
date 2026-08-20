#!/usr/bin/env tsx
/**
 * seed-demo-calapan.ts — Idempotent seed for an ISOLATED demo tenant
 * "Calapan City" (slug `calapan-demo` by default) with 500+ fully-fabricated
 * fisherfolk, each carrying a real photo + signature image uploaded to
 * Telegram storage.
 *
 * NEVER touches the real `calapan-city` tenant — everything here is scoped
 * to the demo tenant's own id, including uploaded MediaObjects.
 *
 * Modeled on:
 *   - apps/web/scripts/seed-demo.ts (env loading, tenant-by-slug, seeded RNG,
 *     idempotent upserts, CLI flags)
 *   - packages/db/scripts/seed-qa-demo.ts (upload → MediaObject upsert →
 *     link storage key onto fisherfolk.photo/signature)
 *   - packages/db/scripts/upload-local-assets.ts (direct
 *     uploadDocumentToTelegram + mediaObject.upsert write path, mirrors
 *     apps/web/src/server/trpc/routers/upload.ts's telegram branch)
 *   - packages/db/prisma/seed.ts (calapan-city barangayList + RBAC upsert
 *     pattern)
 *
 * Usage (from apps/web, after loading env):
 *   set -a; . ./.env.dev; set +a
 *   pnpm --filter @frms/web exec tsx scripts/seed-demo-calapan.ts \
 *     [--tenant <slug>]        (default: "calapan-demo")
 *     [--name <name>]          (default: "Calapan City")
 *     [--count <n>]            (default: 500)
 *     [--photo-pool <n>]       (default: 100)
 *     [--sig-pool <n>]         (default: 100)
 *     [--seed <n>]             (default: 4242)
 *
 * Required env: DATABASE_URL, STORAGE_BACKEND=telegram, TELEGRAM_BOT_TOKEN,
 * TELEGRAM_DEFAULT_CHANNEL_ID (used unless the demo tenant's own
 * telegramChannelId is set).
 */

import dns from "node:dns";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Force IPv4 first — WSL2 lesson (node.fetch.wsl2-ipv6-etimedout): a raw
// fetch() over the host's flaky IPv6 route ETIMEDOUTs. Setting the DNS
// result order avoids most of it; the https.Agent below is the belt-and-
// braces fallback for the direct fetch() calls in this file (the Telegram
// upload path itself already retries via uploadDocumentToTelegram).
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* older Node without setDefaultResultOrder — best effort only */
}

const ipv4Agent = new https.Agent({ family: 4 });

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
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* file absent — skip */
  }
}
loadEnvFile(path.resolve(process.cwd(), "../../.env.dev"));
loadEnvFile(path.resolve(process.cwd(), "../../.env"));

import { PrismaClient } from "@frms/db";
import bcrypt from "bcryptjs";
import {
  generateStorageKey,
  getTelegramBotToken,
  uploadDocumentToTelegram,
} from "@frms/storage";

// ESM-safe __dirname (for the local demo-asset fallback pool).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEMO_ASSETS_DIR = path.resolve(__dirname, "..", "..", "..", "packages", "db", "demo-assets");

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

const TENANT_SLUG = getArg("tenant") ?? "calapan-demo";
const TENANT_NAME = getArg("name") ?? "Calapan City";
const N_FISHERFOLK = intArg("count", 500);
const N_PHOTO_POOL = intArg("photo-pool", 100);
const N_SIG_POOL = intArg("sig-pool", 100);
const RNG_SEED = intArg("seed", 4242);

const CURRENT_YEAR = 2026;

// ── Deterministic RNG (mulberry32) — mirrors seed-demo.ts ────────────────────
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
const rng = makeRng(RNG_SEED);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]!;
const randInt = (lo: number, hi: number): number => lo + Math.floor(rng() * (hi - lo + 1));

// ── Fabricated Filipino name pools (hand-rolled — safe: isolated demo tenant) ─
const MALE_FIRST_NAMES = [
  "Juan", "Jose", "Antonio", "Pedro", "Ramon", "Andres", "Miguel", "Rafael", "Carlos", "Eduardo",
  "Fernando", "Ricardo", "Roberto", "Alfredo", "Alberto", "Ernesto", "Gregorio", "Emilio", "Danilo", "Rodolfo",
  "Bienvenido", "Marcelo", "Rogelio", "Teodoro", "Vicente", "Leonardo", "Mario", "Renato", "Romeo", "Salvador",
  "Ariel", "Bayani", "Crisanto", "Dominador", "Eusebio", "Felix", "Gaudencio", "Hilario", "Isidro", "Jaime",
  "Kristian", "Leo", "Marlon", "Noel", "Oscar", "Patricio", "Quirino", "Reynaldo", "Santiago", "Timoteo",
  "Ulpiano", "Virgilio", "Wilfredo", "Xavier", "Yusuf", "Zosimo", "Angelo", "Benedicto", "Constantino", "Dante",
];
const FEMALE_FIRST_NAMES = [
  "Maria", "Rosario", "Carmen", "Teresita", "Corazon", "Remedios", "Elena", "Luzviminda", "Aurora", "Consuelo",
  "Josefina", "Leonora", "Milagros", "Nenita", "Ofelia", "Perla", "Rosa", "Salome", "Trinidad", "Veronica",
  "Adoracion", "Belen", "Concepcion", "Divina", "Estrella", "Felicidad", "Gloria", "Herminia", "Imelda", "Julieta",
  "Kristine", "Leticia", "Marites", "Norma", "Ompong", "Precilla", "Quintina", "Rebecca", "Susana", "Teodora",
  "Ursula", "Victoria", "Wilma", "Ximena", "Yolanda", "Zenaida", "Angelica", "Beatriz", "Cristina", "Delia",
  "Erlinda", "Flordeliza", "Gemma", "Honorata", "Isabel", "Jocelyn", "Karla", "Lorna", "Myrna", "Natividad",
];
const SURNAMES = [
  "Dela Cruz", "Santos", "Reyes", "Garcia", "Mendoza", "Torres", "Flores", "Ramos", "Aquino", "Bautista",
  "Castro", "Fernandez", "Gonzales", "Hernandez", "Lopez", "Marquez", "Navarro", "Ocampo", "Pascual", "Quiambao",
  "Rivera", "Salazar", "Tolentino", "Villanueva", "Aguilar", "Belmonte", "Cabrera", "Domingo", "Espiritu", "Francisco",
  "Guevarra", "Ignacio", "Jimenez", "Lacson", "Manalo", "Nepomuceno", "Ordonez", "Pangilinan", "Quirino", "Ramirez",
  "Serrano", "Trinidad", "Umali", "Valdez", "Yatco", "Zamora", "Abad", "Bernardo", "Cortez", "Diaz",
  "Enriquez", "Gutierrez", "Herrera", "Isip", "Javier", "Lim", "Macaraeg", "Nolasco", "Padilla", "Rosales",
];

// ── Prisma + storage ───────────────────────────────────────────────────────
const prisma = new PrismaClient();

async function fetchPersonDoesNotExist(timeoutMs = 15_000): Promise<Buffer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://thispersondoesnotexist.com/", {
      signal: controller.signal,
      // @ts-expect-error -- undici accepts a Node https.Agent via the
      // "dispatcher"-adjacent `agent` field on some runtimes; harmless no-op
      // if ignored, kept as a best-effort IPv4 nudge alongside dns ordering.
      agent: ipv4Agent,
    });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Magic-byte validation (mirrors fix-demo-photos.ts): the endpoint has
    // been observed returning an HTML landing page with 200/OK — never save
    // non-JPEG bytes as a photo. Falls back to the bundled fixtures instead.
    if (buffer.length < 2048) return null;
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) return null;
    return buffer;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function uploadBufferToTelegram(
  tenantId: string,
  chatId: string,
  botToken: string,
  entityType: "fisherfolk-photo" | "fisherfolk-signature",
  filename: string,
  mimeType: string,
  buffer: Buffer,
): Promise<string> {
  const key = generateStorageKey(tenantId, entityType, filename);
  const { messageId, fileId } = await uploadDocumentToTelegram({
    botToken,
    chatId,
    bytes: new Uint8Array(buffer),
    filename,
    mimeType,
    caption: `${tenantId} · ${entityType} · ${key}`,
    maxRetries: 10,
  });

  const mediaObjectFields = {
    entityType,
    backend: "telegram",
    telegramChatId: chatId,
    telegramFileId: fileId,
    telegramMessageId: BigInt(messageId),
    sizeBytes: buffer.length,
    mimeType,
    migratedAt: new Date(),
  };

  await prisma.mediaObject.upsert({
    where: { tenantId_storageKey: { tenantId, storageKey: key } },
    create: { tenantId, storageKey: key, ...mediaObjectFields },
    update: mediaObjectFields,
  });

  return key;
}

async function buildPhotoPool(
  tenantId: string,
  chatId: string,
  botToken: string,
  count: number,
): Promise<string[]> {
  const keys: string[] = [];

  for (let i = 0; i < count; i++) {
    const buffer = await fetchPersonDoesNotExist();
    if (buffer !== null) {
      const key = await uploadBufferToTelegram(
        tenantId,
        chatId,
        botToken,
        "fisherfolk-photo",
        `demo-face-${String(i + 1).padStart(3, "0")}.jpg`,
        "image/jpeg",
        buffer,
      );
      keys.push(key);
      continue;
    }
    // Fallback: cycle the bundled QA fisherfolk photo fixtures.
    const fallbackFiles = fs
      .readdirSync(DEMO_ASSETS_DIR)
      .filter((f) => /^qa-fisherfolk-photo-\d+\.jpe?g$/i.test(f))
      .sort();
    if (fallbackFiles.length === 0) {
      throw new Error("Photo pool fetch failed and no local fallback assets found in demo-assets/.");
    }
    const fallbackFile = fallbackFiles[i % fallbackFiles.length]!;
    const fallbackBuffer = fs.readFileSync(path.join(DEMO_ASSETS_DIR, fallbackFile));
    const key = await uploadBufferToTelegram(
      tenantId,
      chatId,
      botToken,
      "fisherfolk-photo",
      `demo-face-fallback-${String(i + 1).padStart(3, "0")}.jpg`,
      "image/jpeg",
      fallbackBuffer,
    );
    keys.push(key);
  }
  return keys;
}

async function buildSignaturePool(
  demoTenantId: string,
  chatId: string,
  botToken: string,
  count: number,
): Promise<string[]> {
  // Prefer copying real signature MediaObjects belonging to the calapan-city
  // tenant into new demo-tenant-prefixed MediaObjects — no bytes re-uploaded
  // (Telegram file_id is reused directly), just a fresh ledger row.
  const realTenant = await prisma.tenant.findUnique({ where: { slug: "calapan-city" } });
  const keys: string[] = [];

  if (realTenant) {
    const sourceRows = await prisma.mediaObject.findMany({
      where: {
        tenantId: realTenant.id,
        entityType: { contains: "signature" },
        telegramFileId: { not: null },
      },
      take: count,
    });

    for (const source of sourceRows) {
      const key = generateStorageKey(demoTenantId, source.entityType, "demo-signature.png");
      const fields = {
        entityType: source.entityType,
        backend: "telegram",
        telegramChatId: source.telegramChatId ?? chatId,
        telegramFileId: source.telegramFileId,
        telegramMessageId: source.telegramMessageId,
        sizeBytes: source.sizeBytes,
        mimeType: source.mimeType,
        migratedAt: new Date(),
      };
      await prisma.mediaObject.upsert({
        where: { tenantId_storageKey: { tenantId: demoTenantId, storageKey: key } },
        create: { tenantId: demoTenantId, storageKey: key, ...fields },
        update: fields,
      });
      keys.push(key);
    }
  }

  if (keys.length > 0) return keys;

  // Fallback: upload the bundled QA signature fixtures directly into the
  // demo tenant.
  const fallbackFiles = fs
    .readdirSync(DEMO_ASSETS_DIR)
    .filter((f) => /^qa-fisherfolk-signature-\d+\.png$/i.test(f))
    .sort();
  if (fallbackFiles.length === 0) {
    throw new Error("No calapan-city signature MediaObjects found and no local fallback signature assets exist.");
  }
  const take = Math.min(count, Math.max(fallbackFiles.length, 1));
  for (let i = 0; i < take; i++) {
    const fallbackFile = fallbackFiles[i % fallbackFiles.length]!;
    const buffer = fs.readFileSync(path.join(DEMO_ASSETS_DIR, fallbackFile));
    const key = await uploadBufferToTelegram(
      demoTenantId,
      chatId,
      botToken,
      "fisherfolk-signature",
      `demo-signature-fallback-${String(i + 1).padStart(3, "0")}.png`,
      "image/png",
      buffer,
    );
    keys.push(key);
  }
  return keys;
}

// ── main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(`🌱 Seeding demo tenant "${TENANT_SLUG}" (${TENANT_NAME})...`);

  // ── 1. Tenant ────────────────────────────────────────────────────────────
  // REAL Calapan barangay names, all matching the density-map centroid keys in
  // apps/web/src/data/calapan-barangay-centroids.ts EXACTLY (so every seeded
  // record plots on the barangay density map). Notable spellings: the centroid
  // key is "Lumang Bayan" (two words), and "Wawa" is mapped to canonical
  // "Sabang" in that file — use the canonical key here.
  const barangayList = [
    "Balingayan", "Balite", "Baruyan", "Batino", "Bayanan I", "Bayanan II",
    "Calero", "Camilmil", "Ibaba East", "Ibaba West", "Ilaya", "San Vicente Central",
    "Guinobatan", "Lumang Bayan", "Mahal na Pangalan", "Malad", "Masipit", "Nag-iba I",
    "Nag-iba II", "Navotas", "Pachoca", "Palhi", "Panggalaan", "Parang", "Patas",
    "Personas", "Putingtubig", "Salong", "Silonay", "Suqui", "Tawiran", "Tibag", "Sabang",
  ];

  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    // Heal name + barangayList on re-run (real centroid-keyed names replace
    // the earlier generic "Barangay N" entries).
    update: { name: TENANT_NAME, barangayList },
    create: {
      slug: TENANT_SLUG,
      name: TENANT_NAME,
      accentColor: "#4F8EF7",
      primaryColor: "#F97316",
      secondaryColor: "#1E3A5F",
      barangayList,
      violationSubjects: [
        "Illegal Fishing",
        "No Municipal Fishing License",
        "Fishing in Restricted Zone",
        "Use of Fine Mesh Net",
      ],
      currentRegistrationYear: CURRENT_YEAR,
      status: "ACTIVE",
    },
  });
  const tenantId = tenant.id;
  console.log(`  ✅ Tenant ready: ${tenant.name} (${tenant.slug})`);

  // ── 2. Demo users ────────────────────────────────────────────────────────
  const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD ?? "DemoCalapan_LocalDev_2026";
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const superadmin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: "demo-super@calapan-demo.local" } },
    update: { passwordHash, role: "tenant_superadmin", status: "ACTIVE" },
    create: {
      tenantId,
      email: "demo-super@calapan-demo.local",
      username: "demo-super@calapan-demo.local",
      passwordHash,
      name: "Demo Tenant Superadmin",
      role: "tenant_superadmin",
      securityVersion: 1,
      status: "ACTIVE",
    },
  });
  console.log(`  ✅ tenant_superadmin ready: ${superadmin.username}`);

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: "admin@demo.com" } },
    update: { passwordHash, role: "tenant_admin", status: "ACTIVE" },
    create: {
      tenantId,
      email: "admin@demo.com",
      username: "admin@demo.com",
      passwordHash,
      name: "Demo Tenant Admin",
      role: "tenant_admin",
      securityVersion: 1,
      status: "ACTIVE",
    },
  });
  console.log(`  ✅ tenant_admin ready: ${admin.username}`);

  const encoder = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: "encoder@calapan-demo.local" } },
    update: { passwordHash, role: "encoder", status: "ACTIVE" },
    create: {
      tenantId,
      email: "encoder@calapan-demo.local",
      username: "encoder@calapan-demo.local",
      passwordHash,
      name: "Demo Encoder",
      role: "encoder",
      securityVersion: 1,
      status: "ACTIVE",
    },
  });
  console.log(`  ✅ encoder ready: ${encoder.username}`);

  // ── 3. Asset pools ───────────────────────────────────────────────────────
  const chatId = tenant.telegramChannelId ?? process.env["TELEGRAM_DEFAULT_CHANNEL_ID"] ?? "";
  if (chatId === "") {
    throw new Error(
      "Missing Telegram chat id — set tenant.telegramChannelId or TELEGRAM_DEFAULT_CHANNEL_ID.",
    );
  }
  const botToken = getTelegramBotToken();

  console.log(`ℹ  Building photo pool (${N_PHOTO_POOL})...`);
  const photoKeys = await buildPhotoPool(tenantId, chatId, botToken, N_PHOTO_POOL);
  console.log(`  ✅ Photo pool: ${photoKeys.length} keys.`);

  console.log(`ℹ  Building signature pool (${N_SIG_POOL})...`);
  const sigKeys = await buildSignaturePool(tenantId, chatId, botToken, N_SIG_POOL);
  console.log(`  ✅ Signature pool: ${sigKeys.length} keys.`);

  // ── 3.5 Categories (BEFORE the fisherfolk loop, so every record can carry
  // 1-2 categoryIds — the dimension behind every category chart/breakdown).
  // Same defs/slugs as seed-demo-calapan-extras.ts CATEGORY_DEFS: its later
  // upsert (update:{}) is a no-op against these rows, so both scripts stay
  // idempotent regardless of run order.
  // OFFICIAL calapan-city taxonomy — VERBATIM name/slug/displayColor/iconEmoji/
  // displayOrder from packages/db/prisma/seed.ts `defaultCategories` (uniform
  // color/emoji, like the real tenant). Index === displayOrder-1.
  const CATEGORY_DEFS: Array<{ name: string; emoji: string; color: string }> = [
    { name: "Boat Owner/Operator", emoji: "🐟", color: "#4F8EF7" },
    { name: "Capture Fishing", emoji: "🐟", color: "#4F8EF7" },
    { name: "Gleaning", emoji: "🐟", color: "#4F8EF7" },
    { name: "Vendor", emoji: "🐟", color: "#4F8EF7" },
    { name: "Fish Processing", emoji: "🐟", color: "#4F8EF7" },
    { name: "Aquaculture", emoji: "🐟", color: "#4F8EF7" },
  ];
  const slugifyCategory = (name: string): string =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const categoryIdList: string[] = [];
  for (let i = 0; i < CATEGORY_DEFS.length; i++) {
    const c = CATEGORY_DEFS[i]!;
    const upserted = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId, slug: slugifyCategory(c.name) } },
      update: {},
      create: {
        tenantId,
        name: c.name,
        slug: slugifyCategory(c.name),
        displayColor: c.color,
        iconType: "EMOJI",
        iconEmoji: c.emoji,
        displayOrder: i,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    categoryIdList.push(upserted.id);
  }
  console.log(`  ✅ Categories ready: ${categoryIdList.length} (assignable to fisherfolk).`);

  // Weighted category pick MIRRORS the real calapan-city proportions (measured
  // read-only 2026-08-20: Boat Owner/Operator 27.9% · Capture Fishing 48.9% ·
  // Gleaning 5.4% · Vendor 15.5% · Fish Processing 0.8% · Aquaculture 1.6%);
  // ~35% carry a second category. Index-aligned with CATEGORY_DEFS above.
  const CATEGORY_WEIGHTS = [28, 48, 5, 16, 1, 2];
  const totalCategoryWeight = CATEGORY_WEIGHTS.reduce((a, b) => a + b, 0);
  function pickWeightedCategoryIndex(): number {
    let roll = rng() * totalCategoryWeight;
    for (let i = 0; i < CATEGORY_WEIGHTS.length; i++) {
      roll -= CATEGORY_WEIGHTS[i]!;
      if (roll < 0) return i;
    }
    return 0;
  }
  function pickCategoryIds(): string[] {
    const primary = pickWeightedCategoryIndex();
    const ids = [categoryIdList[primary]!];
    if (rng() < 0.35) {
      const secondary = pickWeightedCategoryIndex();
      if (secondary !== primary) ids.push(categoryIdList[secondary]!);
    }
    return ids;
  }

  // ── 4. Fisherfolk ────────────────────────────────────────────────────────
  const STATUS_WEIGHTED: Array<"ACTIVE" | "NEW" | "RENEWED"> = [
    "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "NEW", "NEW", "RENEWED",
  ];
  const CIVIL_STATUSES: Array<"SINGLE" | "MARRIED" | "WIDOWED" | "SEPARATED" | "DIVORCED"> = [
    "SINGLE", "MARRIED", "WIDOWED", "SEPARATED", "DIVORCED",
  ];

  let created = 0;
  let updated = 0;

  for (let i = 1; i <= N_FISHERFOLK; i++) {
    const idNumber = `DEMO-${CURRENT_YEAR}-${String(i).padStart(5, "0")}`;
    const sex: "MALE" | "FEMALE" = rng() < 0.5 ? "MALE" : "FEMALE";
    const firstName = sex === "MALE" ? pick(MALE_FIRST_NAMES) : pick(FEMALE_FIRST_NAMES);
    const lastName = pick(SURNAMES);
    const middleName = pick(SURNAMES);
    const fullName = `${lastName}, ${firstName} ${middleName}`;
    const barangay = pick(barangayList);
    const registrationYear = randInt(2023, 2026);

    // Age 18-75 as of "today" (relative to CURRENT_YEAR).
    const age = randInt(18, 75);
    const birthYear = CURRENT_YEAR - age;
    const birthMonth = randInt(1, 12);
    const birthDay = randInt(1, 28);
    const dateOfBirth = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));

    const contactNumber = `09${String(randInt(100000000, 999999999))}`;
    const status = pick(STATUS_WEIGHTED);
    const civilStatus = pick(CIVIL_STATUSES);
    const photo = pick(photoKeys);
    const signature = pick(sigKeys);
    const categoryIds = pickCategoryIds();
    const address = `Purok ${randInt(1, 7)}, ${barangay}, ${TENANT_NAME}`;

    const result = await prisma.fisherfolk.upsert({
      where: { tenantId_idNumber: { tenantId, idNumber } },
      // HEAL on re-run: earlier runs created these records with
      // categoryIds: [] and generic "Barangay N" names — repair both so the
      // category charts and the density map fill without a wipe.
      update: { categoryIds, barangay, address },
      create: {
        tenantId,
        idNumber,
        fullName,
        lastName,
        firstName,
        middleName,
        address,
        barangay,
        dateOfBirth,
        sex,
        civilStatus,
        contactNumber,
        categoryIds,
        photo,
        signature,
        status,
        registrationYear,
        remarks: "[DEMO] fabricated record — safe to delete",
        createdById: encoder.id,
      },
      select: { id: true, createdAt: true, updatedAt: true },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
    } else {
      updated++;
    }

    if (i % 50 === 0) {
      console.log(`  … ${i}/${N_FISHERFOLK} fisherfolk processed`);
    }
  }

  const finalCount = await prisma.fisherfolk.count({ where: { tenantId } });
  console.log(
    `\n🎉 Demo seed complete for tenant "${TENANT_SLUG}": ${finalCount} fisherfolk total ` +
      `(${created} newly created, ${updated} already present this run).`,
  );
  console.log(`   Photo pool: ${photoKeys.length} · Signature pool: ${sigKeys.length}`);
  console.log(
    `   Logins (password "${DEMO_PASSWORD}"): ${superadmin.username} · ${admin.username} · ${encoder.username}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error("❌ seed-demo-calapan failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
