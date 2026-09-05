import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth";

export default function HomeScreen() {
  const { user, signOut } = useAuth();

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

      <Text style={styles.note}>
        QR scan + search — coming in Module B (FIS-37).
      </Text>

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
  note: {
    marginTop: 24,
    marginBottom: 24,
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
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
