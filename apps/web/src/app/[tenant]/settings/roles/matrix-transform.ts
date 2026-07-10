/**
 * Pure helpers for the Role-Builder permission matrix (PD-005 Chunk 7).
 *
 * The wire format (customRole.list / getById / create / update) is a SPARSE
 * array of `{ featureKey, view, write, update, delete }` grants — rows for
 * features with no permissions at all are simply omitted. The UI, however,
 * needs a dense grid (every FeatureKey × every action, always present) so a
 * checkbox always has a defined checked state. These two pure functions do
 * that conversion in both directions, kept framework-free so they are
 * trivially unit-testable without rendering anything.
 */
import { FEATURE_KEYS, type FeatureKey } from "@frms/shared/rbac";

export const MATRIX_ACTIONS = ["view", "write", "update", "delete"] as const;
export type MatrixAction = (typeof MATRIX_ACTIONS)[number];

export interface PermissionGrant {
  featureKey: FeatureKey;
  view: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
}

/**
 * Lenient input shape for `permissionsToGrid` — the tRPC `customRole.list` /
 * `getById` output types `featureKey` as `string` (its Prisma-backed return
 * shape isn't narrowed to the `FeatureKey` union), even though every row is
 * a valid FeatureKey in practice. `permissionsToGrid` already ignores any
 * row whose featureKey doesn't match a known FeatureKey, so accepting the
 * wider type here is safe.
 */
export interface RawPermissionGrant {
  featureKey: string;
  view: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
}

/** Dense grid: every FeatureKey maps to a fully-populated action → boolean row. */
export type PermissionGrid = Record<FeatureKey, Record<MatrixAction, boolean>>;

/** Builds an all-false grid covering every known FeatureKey. */
export function buildEmptyGrid(): PermissionGrid {
  const grid = {} as PermissionGrid;
  for (const key of FEATURE_KEYS) {
    grid[key] = { view: false, write: false, update: false, delete: false };
  }
  return grid;
}

/**
 * Sparse wire-format grants → dense grid for the checkbox matrix.
 * Unknown/omitted features default to all-false; any grant not matching a
 * known FeatureKey is ignored defensively (should never happen — the server
 * already validates against `z.enum(FEATURE_KEYS)`).
 */
export function permissionsToGrid(
  permissions: readonly RawPermissionGrant[],
): PermissionGrid {
  const grid = buildEmptyGrid();
  for (const grant of permissions) {
    if (!(grant.featureKey in grid)) continue;
    grid[grant.featureKey as FeatureKey] = {
      view: grant.view,
      write: grant.write,
      update: grant.update,
      delete: grant.delete,
    };
  }
  return grid;
}

/**
 * Dense grid → sparse wire-format array. A row is included only when at
 * least one action is checked — an all-false row is equivalent to "no grant"
 * so it is dropped, keeping the payload sparse (matches the API's own
 * sparse-permissions convention for `create`).
 */
export function gridToPermissions(grid: PermissionGrid): PermissionGrant[] {
  const out: PermissionGrant[] = [];
  for (const key of FEATURE_KEYS) {
    const row = grid[key];
    if (row.view || row.write || row.update || row.delete) {
      out.push({ featureKey: key, ...row });
    }
  }
  return out;
}

/** Returns a new grid with a single cell toggled — never mutates the input. */
export function toggleCell(
  grid: PermissionGrid,
  featureKey: FeatureKey,
  action: MatrixAction,
  checked: boolean,
): PermissionGrid {
  return {
    ...grid,
    [featureKey]: { ...grid[featureKey], [action]: checked },
  };
}

/** Returns a new grid with every action for one feature row set to `checked`. */
export function setRow(
  grid: PermissionGrid,
  featureKey: FeatureKey,
  checked: boolean,
): PermissionGrid {
  return {
    ...grid,
    [featureKey]: { view: checked, write: checked, update: checked, delete: checked },
  };
}

/** Returns a new grid with one action column set to `checked` for every feature. */
export function setColumn(
  grid: PermissionGrid,
  action: MatrixAction,
  checked: boolean,
): PermissionGrid {
  const next = { ...grid };
  for (const key of FEATURE_KEYS) {
    next[key] = { ...next[key], [action]: checked };
  }
  return next;
}

/** Validates a custom-role name against the server's `nameSchema` (1-60 trimmed chars). */
export function validateRoleName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Role name is required.";
  if (trimmed.length > 60) return "Role name must be 60 characters or fewer.";
  return null;
}
