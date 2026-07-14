// route-auth.test.ts
//
// Unit tests for requireRouteAuth():
// 1. Valid session with tenant context → returns RouteAuthContext.
// 2. No session → RouteAuthError carrying a 401 response.
// 3. Session with missing userId/tenantId → RouteAuthError (401).

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — vi.hoisted ensures the mock fn exists before the vi.mock
// factory (hoisted above imports) references it.
// ---------------------------------------------------------------------------

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ auth: mockAuth }));

import { requireRouteAuth, RouteAuthError } from "../route-auth";

function makeSession(overrides: { id?: string; tenantId?: string; role?: string } = {}) {
  return {
    user: {
      id: overrides.id ?? "user-1",
      tenantId: overrides.tenantId ?? "tenant-a",
      role: overrides.role ?? "tenant_admin",
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireRouteAuth", () => {
  it("returns the RouteAuthContext when the session is valid", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-42", tenantId: "tenant-42", role: "tenant_superadmin" }));

    const ctx = await requireRouteAuth();

    expect(ctx).toEqual({
      userId: "user-42",
      tenantId: "tenant-42",
      role: "tenant_superadmin",
    });
  });

  it("throws RouteAuthError with a 401 response when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    let caught: unknown;
    try {
      await requireRouteAuth();
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(RouteAuthError);
    expect((caught as RouteAuthError).response.status).toBe(401);
    const body = (await (caught as RouteAuthError).response.json()) as { error: string };
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("throws RouteAuthError 401 when tenantId is empty", async () => {
    mockAuth.mockResolvedValue(makeSession({ tenantId: "" }));

    let caught: unknown;
    try {
      await requireRouteAuth();
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(RouteAuthError);
    expect((caught as RouteAuthError).response.status).toBe(401);
  });
});
