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

export function notificationHref(
  tenant: string,
  entityType: string | null,
  entityId: string | null,
): string | null {
  if (!entityType) return null;

  // List-level targets (no [id] detail route).
  if (entityType === "ImportBatch") {
    // Segment is `import` (NOT data-import); batch id passed as a query param.
    return entityId
      ? `/${tenant}/import?batch=${entityId}`
      : `/${tenant}/import`;
  }
  if (entityType === "IdBatch") return `/${tenant}/id-generator`;
  if (entityType === "Todo") return `/${tenant}/todo`;

  const segment = DETAIL_ROUTES[entityType];
  if (!segment || !entityId) return null;
  return `/${tenant}/${segment}/${entityId}`;
}
