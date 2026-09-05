import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { useCan } from "@/lib/permissions";
import type { FeatureKey } from "@frms/shared/rbac";

// A compact subset of features relevant to a field-staff mobile user.
// Client-side, cosmetic display only — the server remains authoritative.
const DISPLAYED_FEATURES: { key: FeatureKey; label: string }[] = [
  { key: "fisherfolk", label: "Fisherfolk" },
  { key: "vessels", label: "Vessels" },
  { key: "violations", label: "Violations" },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { can } = useCan();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting} accessibilityRole="header">
        Hi, {user?.name ?? "there"}
      </Text>
      <Text style={styles.meta}>Role: {user?.role ?? "—"}</Text>
      <Text style={styles.meta}>Tenant: {user?.tenantSlug ?? "—"}</Text>

      <View style={styles.permTable}>
        <Text style={styles.permTitle}>What you can do</Text>
        {DISPLAYED_FEATURES.map(({ key, label }) => (
          <View key={key} style={styles.permRow}>
            <Text style={styles.permLabel}>{label}</Text>
            <Text style={styles.permValue}>
              View {can(key, "view") ? "✓" : "✗"}  Write{" "}
              {can(key, "write") ? "✓" : "✗"}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        style={styles.button}
        onPress={handleSignOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  meta: {
    fontSize: 15,
    color: "#444",
    marginBottom: 4,
  },
  permTable: {
    marginTop: 24,
    marginBottom: 24,
    gap: 8,
  },
  permTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  permRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  permLabel: {
    fontSize: 14,
    color: "#111",
  },
  permValue: {
    fontSize: 13,
    color: "#444",
  },
  button: {
    backgroundColor: "#b91c1c",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
