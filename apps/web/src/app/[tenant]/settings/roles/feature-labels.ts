/**
 * Human-readable labels for FeatureKey rows in the Role-Builder permission
 * matrix. Mirrors the nav-items.ts label choices where a nav entry exists
 * for the same feature, so the vocabulary stays consistent across the app.
 */
import { FEATURE_KEYS, type FeatureKey } from "@frms/shared/rbac";

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  fisherfolk: "Fisherfolk",
  households: "Household",
  vessels: "Vessels",
  fish_catches: "Fish Catches",
  violations: "Violations",
  ayuda: "Ayuda",
  edit_requests: "Edit Requests",
  kanban: "ToDo (Kanban)",
  reports: "Reports",
  analytics: "Analytics",
  map: "Map",
  notifications: "Notifications",
  id_generator: "ID Generator",
  import: "Data Import",
  audit_log: "Audit Log",
  data_management: "Data Management",
  notes: "Field Diary",
  projects: "Projects",
};

export const MATRIX_ACTION_LABELS: Record<string, string> = {
  view: "View",
  write: "Create",
  update: "Edit",
  delete: "Delete",
};

/** Ordered list of features for consistent row ordering in the matrix. */
export const FEATURE_ROWS: FeatureKey[] = [...FEATURE_KEYS];
