/**
 * Integration tests — ayuda tRPC router
 * (per-household distribution unit: createProgram + addBeneficiary)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/ayuda.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — protectedProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../context";
import { ayudaRouter } from "./ayuda";
import { householdRouter } from "./household";
import { createCallerFactory } from "../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG_A = `ayuda-hh-test-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantId: string;
let testUserId: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(tenantId: string): TRPCContext {
  return {
    session: {
      user: { id: testUserId, name: "Test Admin", email: "admin@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId: testUserId,
    role: "tenant_superadmin",
    tenantId,
    tenantSlug: SLUG_A,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const ayudaCallerFactory = createCallerFactory(ayudaRouter);
const householdCallerFactory = createCallerFactory(householdRouter);
const ayudaCaller = (tenantId: string) => ayudaCallerFactory(makeCtx(tenantId));
const householdCaller = (tenantId: string) =>
  householdCallerFactory(makeCtx(tenantId));

let ffSeq = 0;
async function makeFisherfolk(
  tenantId: string,
  overrides: Record<string, unknown> = {},
) {
  ffSeq += 1;
  const n = ffSeq;
  return platformPrisma.fisherfolk.create({
    data: {
      tenantId,
      idNumber: `AYHHFF-${RUN}-${n}`,
      fullName: `AyudaHHTok${RUN} Fisher ${n}`,
      lastName: `Fisher${n}`,
      firstName: "Test",
      address: `${n} Test St`,
      barangay: "Barangay Test",
      categoryIds: [],
      registrationYear: new Date().getFullYear(),
      createdById: testUserId,
      updatedById: testUserId,
      ...overrides,
    },
  });
}

async function makeHousehold(tenantId: string) {
  const head = await makeFisherfolk(tenantId);
  const { id } = await householdCaller(tenantId).create({ headId: head.id });
  return { householdId: id, headId: head.id };
}

// household.create auto-creates an "F-01" Family for the head — reuse it
// rather than calling family.create again (the head already leads that family).
async function makeFamily(tenantId: string) {
  const { householdId, headId } = await makeHousehold(tenantId);
  const family = await platformPrisma.family.findFirstOrThrow({
    where: { householdId },
    select: { id: true },
  });
  return { familyId: family.id, householdId, headId };
}

async function makeActiveProgram(
  tenantId: string,
  distributionUnit: "FISHERFOLK" | "HOUSEHOLD",
) {
  const program = await ayudaCaller(tenantId).createProgram({
    title: `Program ${distributionUnit} ${RUN}-${Math.random()}`,
    distributionUnit,
  });
  await ayudaCaller(tenantId).publishProgram({ id: program.id });
  return program.id;
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  const existing = await platformPrisma.tenant.findUnique({
    where: { slug: SLUG_A },
  });
  if (existing) {
    await platformPrisma.auditLog.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.ayudaBeneficiary.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.ayudaProgram.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.household.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.fisherfolk.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.tenant.delete({ where: { id: existing.id } });
  }

  const tenant = await platformPrisma.tenant.create({
    data: {
      name: "Ayuda HH Test Tenant",
      slug: SLUG_A,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantId = tenant.id;

  const user = await platformPrisma.user.create({
    data: {
      tenantId: testTenantId,
      email: `ayuda-hh-admin-${RUN}@local`,
      username: `ayuda-hh-admin-${RUN}`,
      passwordHash: "not-real",
      name: "Test Admin",
      role: "tenant_superadmin",
    },
  });
  testUserId = user.id;
});

afterAll(async () => {
  if (!hasDb) return;
  if (!testTenantId) return;

  await platformPrisma.auditLog.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.ayudaBeneficiary.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.ayudaProgram.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.fisherfolk.updateMany({
    where: { tenantId: testTenantId },
    data: { householdId: null },
  });
  await platformPrisma.vessel.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.household.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.fisherfolk.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.category.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.user.deleteMany({ where: { tenantId: testTenantId } });
  await platformPrisma.tenant
    .delete({ where: { id: testTenantId } })
    .catch(() => {
      /* already gone */
    });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("ayuda.createProgram — distributionUnit", () => {
  it("defaults to FISHERFOLK when omitted", async () => {
    const program = await ayudaCaller(testTenantId).createProgram({
      title: `Default Program ${RUN}`,
    });
    expect(program.distributionUnit).toBe("FISHERFOLK");
  });

  it("persists HOUSEHOLD when specified", async () => {
    const program = await ayudaCaller(testTenantId).createProgram({
      title: `Household Program ${RUN}`,
      distributionUnit: "HOUSEHOLD",
    });
    expect(program.distributionUnit).toBe("HOUSEHOLD");
  });
});

describe.skipIf(!hasDb)("ayuda.addBeneficiary — HOUSEHOLD distribution", () => {
  it("records the household head as beneficiary with householdId set", async () => {
    const programId = await makeActiveProgram(testTenantId, "HOUSEHOLD");
    const { householdId, headId } = await makeHousehold(testTenantId);

    const record = await ayudaCaller(testTenantId).addBeneficiary({
      programId,
      householdId,
    });

    expect(record.householdId).toBe(householdId);

    const stored = await platformPrisma.ayudaBeneficiary.findUnique({
      where: { id: record.id },
    });
    expect(stored).not.toBeNull();
    expect(stored!.fisherfolkId).toBe(headId);
    expect(stored!.householdId).toBe(householdId);
  });

  it("blocks re-adding the same household", async () => {
    const programId = await makeActiveProgram(testTenantId, "HOUSEHOLD");
    const { householdId } = await makeHousehold(testTenantId);

    await ayudaCaller(testTenantId).addBeneficiary({ programId, householdId });

    await expect(
      ayudaCaller(testTenantId).addBeneficiary({ programId, householdId }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects missing householdId when distributionUnit is HOUSEHOLD", async () => {
    const programId = await makeActiveProgram(testTenantId, "HOUSEHOLD");
    const ff = await makeFisherfolk(testTenantId);

    await expect(
      ayudaCaller(testTenantId).addBeneficiary({
        programId,
        fisherfolkId: ff.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe.skipIf(!hasDb)(
  "ayuda.addBeneficiary — FISHERFOLK distribution (unchanged)",
  () => {
    it("adds a fisherfolk beneficiary with no householdId", async () => {
      const programId = await makeActiveProgram(testTenantId, "FISHERFOLK");
      const ff = await makeFisherfolk(testTenantId);

      const record = await ayudaCaller(testTenantId).addBeneficiary({
        programId,
        fisherfolkId: ff.id,
      });

      expect(record.householdId).toBeNull();

      const stored = await platformPrisma.ayudaBeneficiary.findUnique({
        where: { id: record.id },
      });
      expect(stored!.fisherfolkId).toBe(ff.id);
      expect(stored!.householdId).toBeNull();
    });

    it("rejects missing fisherfolkId when distributionUnit is FISHERFOLK", async () => {
      const programId = await makeActiveProgram(testTenantId, "FISHERFOLK");
      const { householdId } = await makeHousehold(testTenantId);

      await expect(
        ayudaCaller(testTenantId).addBeneficiary({ programId, householdId }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  },
);

describe.skipIf(!hasDb)(
  "ayuda.addBeneficiary — optional familyId (additive, FIS-8)",
  () => {
    it("persists an optional familyId alongside a FISHERFOLK-distribution beneficiary", async () => {
      const programId = await makeActiveProgram(testTenantId, "FISHERFOLK");
      const { familyId, headId } = await makeFamily(testTenantId);

      const record = await ayudaCaller(testTenantId).addBeneficiary({
        programId,
        fisherfolkId: headId,
        familyId,
      });

      expect(record.familyId).toBe(familyId);

      const stored = await platformPrisma.ayudaBeneficiary.findUnique({
        where: { id: record.id },
      });
      expect(stored!.familyId).toBe(familyId);
    });

    it("omitting familyId leaves it null (default behavior unchanged)", async () => {
      const programId = await makeActiveProgram(testTenantId, "FISHERFOLK");
      const ff = await makeFisherfolk(testTenantId);

      const record = await ayudaCaller(testTenantId).addBeneficiary({
        programId,
        fisherfolkId: ff.id,
      });

      expect(record.familyId).toBeNull();
    });

    it("rejects a familyId that does not exist", async () => {
      const programId = await makeActiveProgram(testTenantId, "FISHERFOLK");
      const ff = await makeFisherfolk(testTenantId);
      const { familyId: deletedFamilyId, householdId } = await makeFamily(
        testTenantId,
      );
      // Delete the household — cascades to the family, leaving a syntactically
      // valid but non-existent cuid to exercise the NOT_FOUND branch.
      await platformPrisma.fisherfolk.updateMany({
        where: { tenantId: testTenantId, householdId },
        data: { householdId: null, familyId: null },
      });
      await platformPrisma.household.delete({ where: { id: householdId } });

      await expect(
        ayudaCaller(testTenantId).addBeneficiary({
          programId,
          fisherfolkId: ff.id,
          familyId: deletedFamilyId,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  },
);

describe.skipIf(!hasDb)(
  "ayuda.addBeneficiaries — bulk-add by familyIds (additive, FIS-8)",
  () => {
    it("bulk-adds family heads and records familyId per beneficiary", async () => {
      const programId = await makeActiveProgram(testTenantId, "FISHERFOLK");
      const famA = await makeFamily(testTenantId);
      const famB = await makeFamily(testTenantId);

      const result = await ayudaCaller(testTenantId).addBeneficiaries({
        programId,
        familyIds: [famA.familyId, famB.familyId],
      });

      expect(result.added).toBe(2);

      const storedA = await platformPrisma.ayudaBeneficiary.findFirst({
        where: { programId, fisherfolkId: famA.headId },
      });
      expect(storedA!.familyId).toBe(famA.familyId);
    });
  },
);

// ─── Multi-filter facet search (M1) ────────────────────────────────────────────

describe.skipIf(!hasDb)(
  "ayuda.filterFacetOptions + ayuda.searchEligibleBeneficiaries",
  () => {
    function ageDob(age: number): Date {
      const d = new Date();
      d.setFullYear(d.getFullYear() - age);
      return d;
    }

    // Each call uses a unique tag so barangay/vesselType/category values never
    // collide with other tests sharing the same tenant (no per-test teardown).
    let trioSeq = 0;
    async function seedFisherfolkTrio(tenantId: string) {
      trioSeq += 1;
      const tag = `${RUN}-${trioSeq}`;
      const barangayA = `Bara-${tag}`;
      const barangayB = `Barb-${tag}`;
      const vesselType = `Motorized-${tag}`;

      const catA = await platformPrisma.category.create({
        data: {
          tenantId,
          name: `CatA-${tag}`,
          slug: `cat-a-${tag}`,
          displayColor: "#123456",
          status: "ACTIVE",
        },
      });

      const f1 = await makeFisherfolk(tenantId, {
        barangay: barangayA,
        categoryIds: [catA.id],
        status: "NEW",
        dateOfBirth: ageDob(30),
      });
      const f2 = await makeFisherfolk(tenantId, {
        barangay: barangayB,
        categoryIds: [],
        status: "RENEWED",
        dateOfBirth: ageDob(60),
      });
      const f3 = await makeFisherfolk(tenantId, {
        barangay: barangayA,
        categoryIds: [catA.id],
        status: "NEW",
        dateOfBirth: ageDob(20),
      });

      await platformPrisma.vessel.create({
        data: {
          tenantId,
          mfvrNumber: `MFVR-${tag}`,
          vesselType,
          status: "ACTIVE",
          owners: { connect: { id: f2.id } },
        },
      });

      const programId = await makeActiveProgram(tenantId, "FISHERFOLK");

      return { catA, f1, f2, f3, programId, barangayA, barangayB, vesselType };
    }

    it("filterFacetOptions returns barangays, categories, vesselTypes, statuses", async () => {
      const { catA, barangayA, barangayB, vesselType } =
        await seedFisherfolkTrio(testTenantId);

      const facets = await ayudaCaller(testTenantId).filterFacetOptions();

      expect(facets.barangays).toContain(barangayA);
      expect(facets.barangays).toContain(barangayB);
      expect(facets.categories.some((c) => c.id === catA.id)).toBe(true);
      expect(facets.vesselTypes).toContain(vesselType);
      expect(facets.statuses).toEqual([
        "NEW",
        "ACTIVE",
        "RENEWED",
        "INACTIVE",
        "ARCHIVED",
      ]);
    });

    it("filters by barangay (multi-value OR within facet)", async () => {
      const { f1, f3, programId, barangayA } =
        await seedFisherfolkTrio(testTenantId);

      const result = await ayudaCaller(testTenantId).searchEligibleBeneficiaries({
        programId,
        filter: { barangays: [barangayA] },
      });

      expect(result.mode).toBe("FISHERFOLK");
      if (result.mode !== "FISHERFOLK") throw new Error("unreachable");
      const ids = result.rows.map((r) => r.id).sort();
      expect(ids).toEqual([f1.id, f3.id].sort());
      expect(result.total).toBe(2);
    });

    it("ANDs facets across barangay + status + ageMax", async () => {
      const { f3, programId, barangayA } =
        await seedFisherfolkTrio(testTenantId);

      const result = await ayudaCaller(testTenantId).searchEligibleBeneficiaries({
        programId,
        filter: { barangays: [barangayA], statuses: ["NEW"], ageMax: 25 },
      });

      if (result.mode !== "FISHERFOLK") throw new Error("unreachable");
      expect(result.rows.map((r) => r.id)).toEqual([f3.id]);
    });

    it("filters vessel owner yes/no", async () => {
      const { f1, f2, f3, programId, barangayA, barangayB } =
        await seedFisherfolkTrio(testTenantId);
      // Scope to this trio's barangays — vesselOwner alone has no unique tag
      // and would otherwise match vessel-owning fisherfolk seeded by other tests.
      const scope = [barangayA, barangayB];

      const owners = await ayudaCaller(testTenantId).searchEligibleBeneficiaries({
        programId,
        filter: { barangays: scope, vesselOwner: "yes" },
      });
      if (owners.mode !== "FISHERFOLK") throw new Error("unreachable");
      expect(owners.rows.map((r) => r.id)).toEqual([f2.id]);

      const nonOwners = await ayudaCaller(
        testTenantId,
      ).searchEligibleBeneficiaries({
        programId,
        filter: { barangays: scope, vesselOwner: "no" },
      });
      if (nonOwners.mode !== "FISHERFOLK") throw new Error("unreachable");
      expect(nonOwners.rows.map((r) => r.id).sort()).toEqual(
        [f1.id, f3.id].sort(),
      );
    });

    it("filters vessel type", async () => {
      const { f2, programId, vesselType } =
        await seedFisherfolkTrio(testTenantId);

      const result = await ayudaCaller(testTenantId).searchEligibleBeneficiaries({
        programId,
        filter: { vesselTypes: [vesselType] },
      });
      if (result.mode !== "FISHERFOLK") throw new Error("unreachable");
      expect(result.rows.map((r) => r.id)).toEqual([f2.id]);
    });

    it("filters by category hasSome", async () => {
      const { catA, f1, f3, programId } = await seedFisherfolkTrio(testTenantId);

      const result = await ayudaCaller(testTenantId).searchEligibleBeneficiaries({
        programId,
        filter: { categoryIds: [catA.id] },
      });
      if (result.mode !== "FISHERFOLK") throw new Error("unreachable");
      expect(result.rows.map((r) => r.id).sort()).toEqual(
        [f1.id, f3.id].sort(),
      );
    });

    it("excludes alreadyEnrolled when onlyEligible", async () => {
      const { f1, f3, programId, barangayA } =
        await seedFisherfolkTrio(testTenantId);

      await ayudaCaller(testTenantId).addBeneficiary({
        programId,
        fisherfolkId: f1.id,
      });

      const result = await ayudaCaller(testTenantId).searchEligibleBeneficiaries({
        programId,
        filter: { barangays: [barangayA] },
        onlyEligible: true,
      });
      if (result.mode !== "FISHERFOLK") throw new Error("unreachable");
      expect(result.rows.map((r) => r.id)).toEqual([f3.id]);
      expect(result.total).toBe(1);
    });

    it("returns matchingIds for the whole eligible set", async () => {
      const { f1, f3, programId, barangayA } =
        await seedFisherfolkTrio(testTenantId);

      const result = await ayudaCaller(testTenantId).searchEligibleBeneficiaries({
        programId,
        filter: { barangays: [barangayA] },
      });
      if (result.mode !== "FISHERFOLK") throw new Error("unreachable");
      expect(result.matchingIds.length).toBe(result.total);
      expect(result.matchingIds.sort()).toEqual([f1.id, f3.id].sort());
      expect(result.matchingTruncated).toBe(false);
    });

    it("household mode filters on head and returns households", async () => {
      const head = await makeFisherfolk(testTenantId, {
        barangay: "Bara",
        status: "NEW",
      });
      const { id: householdId } = await householdCaller(testTenantId).create({
        headId: head.id,
      });
      const programId = await makeActiveProgram(testTenantId, "HOUSEHOLD");

      const result = await ayudaCaller(testTenantId).searchEligibleBeneficiaries({
        programId,
        filter: { statuses: ["NEW"] },
      });

      expect(result.mode).toBe("HOUSEHOLD");
      if (result.mode !== "HOUSEHOLD") throw new Error("unreachable");
      expect(result.rows.some((r) => r.householdId === householdId)).toBe(
        true,
      );
      const matched = result.rows.find((r) => r.householdId === householdId);
      expect(matched?.headId).toBe(head.id);
      expect(result.matchingIds).toContain(householdId);
    });
  },
);

// ─── Bulk add / bulk remove mutations (M1) ─────────────────────────────────────

describe.skipIf(!hasDb)(
  "ayuda.addBeneficiaries + ayuda.removeBeneficiaries",
  () => {
    it("addBeneficiaries bulk-adds and skips duplicates", async () => {
      const programId = await makeActiveProgram(testTenantId, "FISHERFOLK");
      const f1 = await makeFisherfolk(testTenantId);
      const f2 = await makeFisherfolk(testTenantId);
      const f3 = await makeFisherfolk(testTenantId);
      const f4 = await makeFisherfolk(testTenantId);

      const first = await ayudaCaller(testTenantId).addBeneficiaries({
        programId,
        fisherfolkIds: [f1.id, f2.id, f3.id],
      });
      expect(first).toEqual({ added: 3, skipped: 0 });

      const programAfterFirst = await platformPrisma.ayudaProgram.findUnique({
        where: { id: programId },
      });
      expect(programAfterFirst!.beneficiaryCount).toBe(3);

      const second = await ayudaCaller(testTenantId).addBeneficiaries({
        programId,
        fisherfolkIds: [f1.id, f4.id],
      });
      expect(second).toEqual({ added: 1, skipped: 1 });

      const programAfterSecond = await platformPrisma.ayudaProgram.findUnique({
        where: { id: programId },
      });
      expect(programAfterSecond!.beneficiaryCount).toBe(4);
    });

    it("addBeneficiaries rejects non-ACTIVE program", async () => {
      const program = await ayudaCaller(testTenantId).createProgram({
        title: `Draft Bulk Program ${RUN}-${Math.random()}`,
      });
      const f1 = await makeFisherfolk(testTenantId);

      await expect(
        ayudaCaller(testTenantId).addBeneficiaries({
          programId: program.id,
          fisherfolkIds: [f1.id],
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("addBeneficiaries HOUSEHOLD mode records head", async () => {
      const programId = await makeActiveProgram(testTenantId, "HOUSEHOLD");
      const { householdId, headId } = await makeHousehold(testTenantId);

      const result = await ayudaCaller(testTenantId).addBeneficiaries({
        programId,
        householdIds: [householdId],
      });
      expect(result).toEqual({ added: 1, skipped: 0 });

      const stored = await platformPrisma.ayudaBeneficiary.findFirst({
        where: { programId, fisherfolkId: headId },
      });
      expect(stored).not.toBeNull();
      expect(stored!.householdId).toBe(householdId);
    });

    it("removeBeneficiaries deletes PENDING, decrements count, skips RECEIVED", async () => {
      const programId = await makeActiveProgram(testTenantId, "FISHERFOLK");
      const f1 = await makeFisherfolk(testTenantId);
      const f2 = await makeFisherfolk(testTenantId);

      const b1 = await ayudaCaller(testTenantId).addBeneficiary({
        programId,
        fisherfolkId: f1.id,
      });
      const b2 = await ayudaCaller(testTenantId).addBeneficiary({
        programId,
        fisherfolkId: f2.id,
      });

      await ayudaCaller(testTenantId).verifyBeneficiary({
        id: b1.id,
        verificationStatus: "RECEIVED",
      });

      const before = await platformPrisma.ayudaProgram.findUnique({
        where: { id: programId },
      });
      expect(before!.beneficiaryCount).toBe(2);

      const result = await ayudaCaller(testTenantId).removeBeneficiaries({
        programId,
        beneficiaryIds: [b1.id, b2.id],
      });
      expect(result).toEqual({ removed: 1, skipped: 1 });

      const after = await platformPrisma.ayudaProgram.findUnique({
        where: { id: programId },
      });
      expect(after!.beneficiaryCount).toBe(1);

      const receivedStillThere = await platformPrisma.ayudaBeneficiary.findUnique(
        { where: { id: b1.id } },
      );
      expect(receivedStillThere).not.toBeNull();

      const pendingRemoved = await platformPrisma.ayudaBeneficiary.findUnique({
        where: { id: b2.id },
      });
      expect(pendingRemoved).toBeNull();
    });
  },
);
