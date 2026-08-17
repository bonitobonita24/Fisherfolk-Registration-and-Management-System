export { FEATURE_KEYS, type FeatureKey } from "./feature-key";
export {
  DOMAIN_ROLE_PRESETS,
  TENANT_ADMIN_CEILING,
  hasPermission,
  intersectWithCeiling,
  type Actor,
  type FeaturePermissions,
  type PermissionAction,
  type PermissionMatrix,
} from "./permissions";
export {
  PLATFORM_PERMISSION_KEYS,
  type PlatformPermissionKey,
} from "./platform-permission-key";
export {
  PLATFORM_ADMIN_CEILING,
  hasPlatformPermission,
  intersectWithPlatformCeiling,
  type PlatformActor,
  type PlatformPermissionMatrix,
} from "./platform-permissions";
