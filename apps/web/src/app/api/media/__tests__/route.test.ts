// route.test.ts — /api/media proxy
//
// Covers:
//   (a) missing key -> 400
//   (b) unauthenticated -> 401 (RouteAuthError.response)
//   (c) rate-limited -> 429
//   (d) not found -> 404
//   (e) happy path -> 200, correct headers, audit BEFORE resolve
//   (f) resolve throws -> 502

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { TRPCError } from "@trpc/server";

const {
  mockRequireRouteAuth,
  mockRateLimitCheck,
  mockFindUnique,
  mockAuditCreate,
  mockResolveMediaBytes,
  MockRouteAuthError,
} = vi.hoisted(() => {
  class MockRouteAuthError extends Error {
    response: Response;
    constructor(response: Response) {
      super("Route handler authentication failed");
      this.name = "RouteAuthError";
      this.response = response;
    }
  }

  return {
    mockRequireRouteAuth: vi.fn(),
    mockRateLimitCheck: vi.fn(),
    mockFindUnique: vi.fn(),
    mockAuditCreate: vi.fn(),
    mockResolveMediaBytes: vi.fn(),
    MockRouteAuthError,
  };
});

vi.mock("@/server/lib/route-auth", () => ({
  requireRouteAuth: mockRequireRouteAuth,
  RouteAuthError: MockRouteAuthError,
}));

vi.mock("@/server/lib/rate-limit", () => ({
  rateLimiters: {
    mediaDownload: { check: mockRateLimitCheck },
  },
}));

vi.mock("@frms/db", () => ({
  platformPrisma: {
    mediaObject: { findUnique: mockFindUnique },
    auditLog: { create: mockAuditCreate },
  },
}));

vi.mock("@/server/lib/media-bytes", () => ({
  resolveMediaBytes: mockResolveMediaBytes,
}));

import { GET } from "../route";

function makeRequest(query: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/media");
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

const CTX = { userId: "user-1", tenantId: "tenant-1", role: "tenant_admin" };
const MEDIA_ROW = {
  entityType: "FisherfolkPhoto",
  mimeType: "image/jpeg",
  telegramFileId: "file-abc",
  backend: "telegram",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireRouteAuth.mockResolvedValue(CTX);
  mockRateLimitCheck.mockReturnValue(undefined);
});

describe("GET /api/media", () => {
  it("returns 400 when key is missing", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body).toEqual({ error: "Missing key" });
    expect(mockRequireRouteAuth).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    const unauthorized = new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
    mockRequireRouteAuth.mockRejectedValueOnce(new MockRouteAuthError(unauthorized));

    const res = await GET(makeRequest({ key: "some/key.jpg" }));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate-limited", async () => {
    mockRateLimitCheck.mockImplementationOnce(() => {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "slow down" });
    });

    const res = await GET(makeRequest({ key: "some/key.jpg" }));
    expect(res.status).toBe(429);
    const body = (await res.json()) as { error: string };
    expect(body).toEqual({ error: "Too many requests" });
  });

  it("returns 404 when the MediaObject is not found", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const res = await GET(makeRequest({ key: "missing/key.jpg" }));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body).toEqual({ error: "Not found" });
    expect(mockAuditCreate).not.toHaveBeenCalled();
    expect(mockResolveMediaBytes).not.toHaveBeenCalled();
  });

  it("serves bytes with correct headers and audits BEFORE resolving (happy path)", async () => {
    mockFindUnique.mockResolvedValueOnce(MEDIA_ROW);
    const bytes = Buffer.from("fake-image-bytes");

    const callOrder: string[] = [];
    mockAuditCreate.mockImplementationOnce(() => {
      callOrder.push("audit");
      return Promise.resolve(undefined);
    });
    mockResolveMediaBytes.mockImplementationOnce(() => {
      callOrder.push("resolve");
      return Promise.resolve({ bytes, source: "telegram" });
    });

    const res = await GET(makeRequest({ key: "fisherfolk/photo-1.jpg" }));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("Content-Length")).toBe(String(bytes.byteLength));
    expect(res.headers.get("Cache-Control")).toBe(
      "private, max-age=86400, immutable",
    );
    expect(res.headers.get("Content-Security-Policy")).toBe(
      "default-src 'none'; sandbox; frame-ancestors 'none'",
    );
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Disposition")).toBe("inline");

    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: {
        action: "MEDIA_DOWNLOAD",
        userId: "user-1",
        tenantId: "tenant-1",
        entityType: "FisherfolkPhoto",
        entityId: "fisherfolk/photo-1.jpg",
      },
    });
    expect(mockResolveMediaBytes).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      storageKey: "fisherfolk/photo-1.jpg",
      telegramFileId: "file-abc",
      mimeType: "image/jpeg",
    });

    // Audit must be recorded BEFORE the byte-resolution fetch.
    expect(callOrder).toEqual(["audit", "resolve"]);
  });

  it("returns 502 when resolveMediaBytes throws", async () => {
    mockFindUnique.mockResolvedValueOnce(MEDIA_ROW);
    mockResolveMediaBytes.mockRejectedValueOnce(new Error("both backends failed"));

    const res = await GET(makeRequest({ key: "fisherfolk/photo-1.jpg" }));
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body).toEqual({ error: "Media temporarily unavailable" });
    expect(mockAuditCreate).toHaveBeenCalledTimes(1);
  });
});
