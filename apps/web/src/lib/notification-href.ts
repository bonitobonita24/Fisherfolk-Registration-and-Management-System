/**
 * notification-href.ts — single source of truth for mapping a Notification's
 * polymorphic entity ref (entityType/entityId) to its in-app route.
 *
 * Replaces the previously-duplicated ENTITY_ROUTES maps in
 * app/[tenant]/notifications/page.tsx and components/notification-bell.tsx.
 *
 * Returns the href to navigate to, or null when the notification has no
 * resolvable target (unknown entityType, or a detail-route type without an id).
 */

/** entityType → detail-route segment under /[tenant]/<segment>/[id] */
const DETAIL_ROUTES: Record<string, string> = {
  EditRequest: "edit-requests",
  Fisherfolk: "fisherfolk",
  Vessel: "vessels",
  Violation: "violations",
  Household: "households",
  FishCatch: "fish-catches",
  AyudaProgram: "ayuda",
};

/**
 * Returns the TENANT-RELATIVE href (e.g. `/fisherfolk/${id}`) for a
 * notification's entity ref, or null when unresolvable. Callers prepend the
 * tenant prefix with useTenantHref()/tenantHref() so the link is host-aware
 * (subdirectory vs masked custom domain — see tenant-href.ts).
 */
export function notificationHref(
  entityType: string | null,
  entityId: string | null,
): string | null {
  if (!entityType) return null;

  // List-level targets (no [id] detail route).
  if (entityType === "ImportBatch") {
    // Segment is `import` (NOT data-import); batch id passed as a query param.
    return entityId ? `/import?batch=${entityId}` : `/import`;
  }
  if (entityType === "IdBatch") return `/id-generator`;
  if (entityType === "Todo") return `/todo`;

  const segment = DETAIL_ROUTES[entityType];
  if (!segment || !entityId) return null;
  return `/${segment}/${entityId}`;
}
