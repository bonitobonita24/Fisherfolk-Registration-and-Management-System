import { useMemo } from "react";
import {
  hasPermission,
  type Actor,
  type FeatureKey,
  type PermissionAction,
} from "@frms/shared/rbac";
import { useAuth } from "./auth";

/**
 * useCan() — CLIENT-SIDE, COSMETIC-ONLY gating. This only hides/disables UI
 * affordances the user's role can't act on; the server (tRPC procedures)
 * remains the sole authorization authority and re-checks every request
 * independently. NEVER treat a `true` result here as a security boundary.
 *
 * Built from `role` alone (the mobile login payload does not carry a custom
 * `matrix`), which `hasPermission()` supports — `Actor.matrix` is optional
 * and resolution falls back to the fixed domain-role presets.
 */
export function useCan(): {
  can: (feature: FeatureKey, action: PermissionAction) => boolean;
} {
  const { user } = useAuth();
  const role = user?.role ?? null;

  return useMemo(() => {
    if (!role) {
      return { can: () => false };
    }
    const actor: Actor = { role };
    return {
      can: (feature: FeatureKey, action: PermissionAction) =>
        hasPermission(actor, feature, action),
    };
  }, [role]);
}
