/**
 * aria-hidden → inert shim (pure logic).
 *
 * Radix v1 menu/dialog/popover suppress the background with the `aria-hidden`
 * library's `hideOthers()`, which applies `aria-hidden="true"` (marker attr
 * `data-aria-hidden`) but NOT `inert`. The hidden background subtree therefore
 * still contains tabbable content, which axe flags as `aria-hidden-focus`
 * (WCAG 2.2 AA, SC 4.1.2 — serious). See `aria-hidden`'s own `suppressOthers()`,
 * which would use `inert` where supported; Radix has not adopted it.
 *
 * `syncInert` mirrors `inert` onto exactly the elements Radix marks, and removes
 * it again on close. It only ever touches `inert` that IT added (tracked by
 * {@link SHIM_MARKER}) so a pre-existing `inert` from app code is never disturbed.
 * Applying `inert` here matches the intended modal semantics (background made
 * non-interactive + removed from the a11y tree while an overlay is open).
 */

/** Marks an `inert` attribute that this shim added, so cleanup only removes its own. */
export const SHIM_MARKER = "data-inert-by-a11y-shim";

/** Minimal element surface the pure logic needs — keeps it testable without a DOM. */
export interface AttrElement {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

/** True only when Radix's aria-hidden lib has actively hidden this element. */
export function isRadixHidden(el: AttrElement): boolean {
  return (
    el.hasAttribute("data-aria-hidden") &&
    el.getAttribute("aria-hidden") === "true"
  );
}

/**
 * Reconcile one element's `inert` with its Radix aria-hidden state.
 * - Radix-hidden + not already inert → add `inert` (+ our marker).
 * - No longer Radix-hidden + we added the inert → remove `inert` (+ our marker).
 * Idempotent; never adds our marker over a pre-existing (app-owned) `inert`.
 */
export function syncInert(el: AttrElement): void {
  if (isRadixHidden(el)) {
    if (!el.hasAttribute("inert")) {
      el.setAttribute("inert", "");
      el.setAttribute(SHIM_MARKER, "");
    }
  } else if (el.hasAttribute(SHIM_MARKER)) {
    el.removeAttribute("inert");
    el.removeAttribute(SHIM_MARKER);
  }
}
