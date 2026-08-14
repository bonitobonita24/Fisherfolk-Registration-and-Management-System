import { describe, expect, it } from "vitest";

import {
  normalizeHost,
  parseCustomDomainMap,
  resolveTenantRoute,
} from "../tenant-routing";

const MAP = { "fisherfolk.calapancity.gov.ph": "calapan-city" };

describe("normalizeHost", () => {
  it("lowercases and strips the port", () => {
    expect(normalizeHost("Fisherfolk.Calapancity.Gov.PH:443")).toBe(
      "fisherfolk.calapancity.gov.ph",
    );
  });
  it("returns null for empty/missing", () => {
    expect(normalizeHost(null)).toBeNull();
    expect(normalizeHost("")).toBeNull();
    expect(normalizeHost("   ")).toBeNull();
  });
  it("keeps bracketed IPv6 host without port", () => {
    expect(normalizeHost("[::1]:3000")).toBe("[::1]");
  });
});

describe("resolveTenantRoute — custom domain (masking)", () => {
  it("rewrites the domain root to /<slug>", () => {
    const r = resolveTenantRoute({
      host: "fisherfolk.calapancity.gov.ph",
      pathname: "/",
      customDomainToSlug: MAP,
    });
    expect(r).toEqual({
      slug: "calapan-city",
      source: "host",
      rewriteTo: "/calapan-city",
      redirectTo: null,
    });
  });

  it("rewrites a deep path under the slug", () => {
    const r = resolveTenantRoute({
      host: "fisherfolk.calapancity.gov.ph:443",
      pathname: "/dashboard",
      customDomainToSlug: MAP,
    });
    expect(r.rewriteTo).toBe("/calapan-city/dashboard");
    expect(r.source).toBe("host");
  });

  it("redirects a slug-prefixed URL to its clean form (inverse masking)", () => {
    const r = resolveTenantRoute({
      host: "fisherfolk.calapancity.gov.ph",
      pathname: "/calapan-city/dashboard",
      customDomainToSlug: MAP,
    });
    expect(r).toEqual({
      slug: "calapan-city",
      source: "host",
      rewriteTo: null,
      redirectTo: "/dashboard",
    });
  });

  it("redirects the bare /<slug> to the domain root", () => {
    const r = resolveTenantRoute({
      host: "fisherfolk.calapancity.gov.ph",
      pathname: "/calapan-city",
      customDomainToSlug: MAP,
    });
    expect(r.redirectTo).toBe("/");
    expect(r.rewriteTo).toBeNull();
  });

  it("serves app-level routes (/admin, /login, /platform) as-is on a custom domain", () => {
    for (const p of ["/admin", "/login", "/platform/tenants"]) {
      const r = resolveTenantRoute({
        host: "fisherfolk.calapancity.gov.ph",
        pathname: p,
        customDomainToSlug: MAP,
      });
      expect(r.rewriteTo).toBeNull();
      expect(r.redirectTo).toBeNull();
      expect(r.slug).toBe("calapan-city");
    }
  });

  it("never rewrites reserved paths (api/_next/assets) on a custom domain", () => {
    for (const p of ["/api/trpc/x", "/_next/static/a.js", "/favicon.ico"]) {
      const r = resolveTenantRoute({
        host: "fisherfolk.calapancity.gov.ph",
        pathname: p,
        customDomainToSlug: MAP,
      });
      expect(r.rewriteTo).toBeNull();
      expect(r.slug).toBe("calapan-city");
    }
  });
});

describe("resolveTenantRoute — subdirectory routing (default today)", () => {
  it("uses the first path segment as the slug, no rewrite", () => {
    const r = resolveTenantRoute({
      host: "frms.example.gov.ph",
      pathname: "/calapan-city/dashboard",
      customDomainToSlug: MAP,
    });
    expect(r).toEqual({
      slug: "calapan-city",
      source: "path",
      rewriteTo: null,
      redirectTo: null,
    });
  });

  it("returns no slug for the bare app root", () => {
    const r = resolveTenantRoute({
      host: "frms.example.gov.ph",
      pathname: "/",
      customDomainToSlug: MAP,
    });
    expect(r).toEqual({ slug: null, source: "none", rewriteTo: null, redirectTo: null });
  });

  it("an unknown host falls through to subdirectory routing", () => {
    const r = resolveTenantRoute({
      host: "totally-unknown.example",
      pathname: "/calapan-city/vessels",
      customDomainToSlug: MAP,
    });
    expect(r.source).toBe("path");
    expect(r.rewriteTo).toBeNull();
  });

  it("with NO custom-domain map, behaviour is always subdirectory (inert seam)", () => {
    const r = resolveTenantRoute({
      host: "fisherfolk.calapancity.gov.ph",
      pathname: "/calapan-city/dashboard",
    });
    expect(r.source).toBe("path");
    expect(r.rewriteTo).toBeNull();
  });
});

describe("parseCustomDomainMap", () => {
  it("parses a JSON map and normalizes domains", () => {
    expect(
      parseCustomDomainMap('{"Fisherfolk.CalapanCity.gov.ph":"calapan-city"}'),
    ).toEqual({ "fisherfolk.calapancity.gov.ph": "calapan-city" });
  });
  it("returns {} for unset / malformed / wrong-shape input", () => {
    expect(parseCustomDomainMap(undefined)).toEqual({});
    expect(parseCustomDomainMap("not json")).toEqual({});
    expect(parseCustomDomainMap("[1,2,3]")).toEqual({});
  });
});
