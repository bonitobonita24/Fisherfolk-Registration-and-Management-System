/**
 * route-feature-map — PURE unit tests. No DB, no render, no network.
 * PD-005 Chunk 4, Task A.
 */
import { describe, expect, it } from "vitest";

import { UserRole } from "@frms/shared/types";
import type { Actor } from "@frms/shared/rbac";
import { DOMAIN_ROLE_PRESETS } from "@frms/shared/rbac";
import { SEGMENT_FEATURE_MAP, canAccessRouteSegment } from "../route-feature-map";

const TENANT_SLUG = "calapan-city";
const MAPPED_SEGMENTS = Object.keys(SEGMENT_FEATURE_MAP);

function pathFor(segment: string): string {
  return `/${TENANT_SLUG}/${segment}`;
}

describe("canAccessRouteSegment — tenant_admin: every mapped segment allowed", () => {
  const actor: Actor = { role: UserRole.TENANT_ADMIN };

  it.each(MAPPED_SEGMENTS)("allows /%s", (segment) => {
    expect(canAccessRouteSegment(actor, pathFor(segment))).toBe(true);
  });
});

describe("canAccessRouteSegment — encoder preset: derived from DOMAIN_ROLE_PRESETS.encoder", () => {
  const actor: Actor = { role: UserRole.ENCODER };
  const encoderMatrix = DOMAIN_ROLE_PRESETS.encoder;

  for (const segment of MAPPED_SEGMENTS) {
    const feature = SEGMENT_FEATURE_MAP[segment]!;
    const expected = encoderMatrix[feature]?.view ?? false;

    it(`/${segment} (feature: ${feature}) → ${expected}`, () => {
      expect(canAccessRouteSegment(actor, pathFor(segment))).toBe(expected);
    });
  }

  it("sanity: matches the documented encoder-visible segment set", () => {
    const allowed = MAPPED_SEGMENTS.filter(
      (s) => canAccessRouteSegment(actor, pathFor(s)) === true,
    ).sort();
    expect(allowed).toEqual(
      [
        "fisherfolk",
        "households",
        "vessels",
        "fish-catches",
        "edit-requests",
        "todo",
        "kanban",
        "notes",
        "id-generator",
        "notifications",
        "verify",
      ].sort(),
    );
  });

  it("sanity: matches the documented encoder-denied segment set", () => {
    const denied = MAPPED_SEGMENTS.filter(
      (s) => canAccessRouteSegment(actor, pathFor(s)) === false,
    ).sort();
    expect(denied).toEqual(
      [
        "violations",
        "ayuda",
        "analytics",
        "map",
        "reports",
        "import",
        "audit-log",
      ].sort(),
    );
  });
});

describe("canAccessRouteSegment — viewer preset: every mapped segment allowed (view-only)", () => {
  const actor: Actor = { role: UserRole.VIEWER };

  it.each(MAPPED_SEGMENTS)("allows /%s", (segment) => {
    expect(canAccessRouteSegment(actor, pathFor(segment))).toBe(true);
  });
});

describe("canAccessRouteSegment — bantay_dagat preset: enforcement-scoped subset", () => {
  const actor: Actor = { role: UserRole.BANTAY_DAGAT };

  const expectedVisible = ["violations", "fisherfolk", "vessels", "fish-catches", "verify"];
  const expectedHidden = MAPPED_SEGMENTS.filter((s) => !expectedVisible.includes(s));

  it.each(expectedVisible)("allows /%s", (segment) => {
    expect(canAccessRouteSegment(actor, pathFor(segment))).toBe(true);
  });

  it.each(expectedHidden)("denies /%s", (segment) => {
    expect(canAccessRouteSegment(actor, pathFor(segment))).toBe(false);
  });
});

describe("canAccessRouteSegment — custom-matrix actor: fisherfolk granted, vessels denied", () => {
  const actor: Actor = {
    role: UserRole.ENCODER,
    matrix: {
      fisherfolk: { view: true, write: false, update: false, delete: false },
    },
  };

  it("allows /fisherfolk", () => {
    expect(canAccessRouteSegment(actor, pathFor("fisherfolk"))).toBe(true);
  });

  it("denies /vessels (matrix supersedes the encoder preset)", () => {
    expect(canAccessRouteSegment(actor, pathFor("vessels"))).toBe(false);
  });
});

describe("canAccessRouteSegment — empty-matrix custom actor: denies every mapped segment", () => {
  const actor: Actor = { role: UserRole.ENCODER, matrix: {} };

  it.each(MAPPED_SEGMENTS)("denies /%s", (segment) => {
    expect(canAccessRouteSegment(actor, pathFor(segment))).toBe(false);
  });
});

describe("canAccessRouteSegment — unmapped segments always pass through", () => {
  const emptyMatrixActor: Actor = { role: UserRole.ENCODER, matrix: {} };
  const roles: Actor[] = [
    { role: UserRole.TENANT_MANAGER },
    { role: UserRole.TENANT_SUPERADMIN },
    { role: UserRole.TENANT_ADMIN },
    { role: UserRole.ENCODER },
    { role: UserRole.VIEWER },
    { role: UserRole.BANTAY_DAGAT },
    emptyMatrixActor,
  ];

  const unmappedSegments = ["dashboard", "settings", "user-management"];

  for (const segment of unmappedSegments) {
    it.each(roles)(`allows /${segment} for %j`, (actor) => {
      expect(canAccessRouteSegment(actor, pathFor(segment))).toBe(true);
    });
  }
});

describe("canAccessRouteSegment — no segment present", () => {
  const emptyMatrixActor: Actor = { role: UserRole.ENCODER, matrix: {} };

  it("returns true for /slug (no trailing segment)", () => {
    expect(canAccessRouteSegment(emptyMatrixActor, `/${TENANT_SLUG}`)).toBe(true);
  });

  it("returns true for /slug/ (empty segment)", () => {
    expect(canAccessRouteSegment(emptyMatrixActor, `/${TENANT_SLUG}/`)).toBe(true);
  });
});
