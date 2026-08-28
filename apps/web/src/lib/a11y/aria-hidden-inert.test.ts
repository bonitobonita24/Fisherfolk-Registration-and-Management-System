import { describe, it, expect } from "vitest";

import { syncInert, isRadixHidden, SHIM_MARKER, type AttrElement } from "./aria-hidden-inert";

/** Minimal in-memory element implementing the AttrElement surface. */
function makeEl(initial: Record<string, string> = {}): AttrElement & {
  attrs: Map<string, string>;
} {
  const attrs = new Map(Object.entries(initial));
  return {
    attrs,
    getAttribute: (n) => (attrs.has(n) ? (attrs.get(n) as string) : null),
    hasAttribute: (n) => attrs.has(n),
    setAttribute: (n, v) => void attrs.set(n, v),
    removeAttribute: (n) => void attrs.delete(n),
  };
}

const radixHidden = { "data-aria-hidden": "true", "aria-hidden": "true" };

describe("isRadixHidden", () => {
  it("is true only with BOTH the marker and aria-hidden=true", () => {
    expect(isRadixHidden(makeEl(radixHidden))).toBe(true);
    expect(isRadixHidden(makeEl({ "aria-hidden": "true" }))).toBe(false); // no marker
    expect(isRadixHidden(makeEl({ "data-aria-hidden": "true" }))).toBe(false); // no aria-hidden
    expect(isRadixHidden(makeEl({ ...radixHidden, "aria-hidden": "false" }))).toBe(false);
  });
});

describe("syncInert — open then close", () => {
  it("adds inert + marker when Radix hides the element", () => {
    const el = makeEl(radixHidden);
    syncInert(el);
    expect(el.hasAttribute("inert")).toBe(true);
    expect(el.hasAttribute(SHIM_MARKER)).toBe(true);
  });

  it("removes inert + marker once Radix un-hides the element", () => {
    const el = makeEl(radixHidden);
    syncInert(el); // open
    el.removeAttribute("data-aria-hidden");
    el.removeAttribute("aria-hidden");
    syncInert(el); // close
    expect(el.hasAttribute("inert")).toBe(false);
    expect(el.hasAttribute(SHIM_MARKER)).toBe(false);
  });
});

describe("syncInert — guardrails", () => {
  it("never inerts an aria-hidden element that Radix did NOT mark (e.g. decorative icon)", () => {
    const el = makeEl({ "aria-hidden": "true" }); // no data-aria-hidden marker
    syncInert(el);
    expect(el.hasAttribute("inert")).toBe(false);
    expect(el.hasAttribute(SHIM_MARKER)).toBe(false);
  });

  it("preserves a pre-existing app-owned inert and never removes it on close", () => {
    const el = makeEl({ inert: "", ...radixHidden }); // app already set inert
    syncInert(el); // hidden, but inert already present → do not claim it
    expect(el.hasAttribute(SHIM_MARKER)).toBe(false);
    // now Radix un-hides → our shim must leave the app's inert intact
    el.removeAttribute("data-aria-hidden");
    el.removeAttribute("aria-hidden");
    syncInert(el);
    expect(el.hasAttribute("inert")).toBe(true);
  });

  it("is idempotent across repeated calls while hidden", () => {
    const el = makeEl(radixHidden);
    syncInert(el);
    syncInert(el);
    syncInert(el);
    expect(el.hasAttribute("inert")).toBe(true);
    expect(el.hasAttribute(SHIM_MARKER)).toBe(true);
  });
});
