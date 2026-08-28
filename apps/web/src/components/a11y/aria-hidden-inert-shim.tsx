"use client";

import { useEffect } from "react";

import { syncInert } from "@/lib/a11y/aria-hidden-inert";

/**
 * App-wide a11y shim: mirrors `inert` onto any element Radix suppresses with
 * `aria-hidden` (its `hideOthers()` sets `aria-hidden` but not `inert`), so the
 * hidden background subtree stops tripping axe's `aria-hidden-focus` rule
 * (WCAG 2.2 AA, SC 4.1.2). Pure reconciliation lives in `@/lib/a11y/aria-hidden-inert`;
 * this only wires it to the DOM via a MutationObserver. Renders nothing.
 *
 * Mounted once at the root layout so it covers every Radix overlay in the app
 * (dropdown menus, dialogs, popovers, alert dialogs) on every route — including
 * pre-auth surfaces like the login page — not just the authenticated app-shell.
 */
export function AriaHiddenInertShim(): null {
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Reconcile anything already marked (e.g. an overlay open at mount).
    document
      .querySelectorAll("[data-aria-hidden]")
      .forEach((el) => syncInert(el));

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        syncInert(record.target as Element);
      }
    });

    // Radix marks already-mounted background siblings, so watching the two
    // relevant attributes across the body subtree is sufficient and cheap
    // (fires only on overlay open/close).
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-aria-hidden", "aria-hidden"],
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
