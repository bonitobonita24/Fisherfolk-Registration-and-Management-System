import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "@/components/StatusBadge";
import { useTrpc } from "@/lib/auth";
import { useCan } from "@/lib/permissions";

// This screen is READ-ONLY (M1 field staff view); no mutations here. Data fetch
// runs through react-query (QueryClientProvider is set up in app/_layout.tsx).
export default function FisherfolkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trpc = useTrpc();
  const { can } = useCan();
  const canView = can("fisherfolk", "view");

  const {
    data: res,
    isLoading: loading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["fisherfolk", "verifyByQr", id],
    enabled: Boolean(id) && canView,
    queryFn: () => trpc.fisherfolk.verifyByQr.query({ raw: id }),
  });

  const error = isError
    ? queryError instanceof Error
      ? queryError.message
      : "Could not load this record."
    : null;
  const notFound = res ? !res.valid : false;
  const record = res && res.valid ? res.fisherfolk : null;

  // Cosmetic-only gate (server remains authoritative) — never query this
  // record if the role can't view fisherfolk records.
  if (!canView) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.message} accessibilityRole="header">
            No access
          </Text>
          <Text style={styles.message}>
            Your role can&apos;t view fisherfolk records.
          </Text>
        </View>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.center}>
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        </View>
      ) : null}

      {!loading && !error && notFound ? (
        <View style={styles.center}>
          <Text style={styles.message}>Record not found.</Text>
        </View>
      ) : null}

      {!loading && !error && record ? (
        <View style={styles.card}>
          <Text style={styles.name} accessibilityRole="header">
            {record.fullName}
          </Text>
          <StatusBadge status={record.status} />
          <Text style={styles.meta}>Barangay: {record.barangay ?? "—"}</Text>
          <Text style={styles.meta}>
            Registration year: {record.registrationYear ?? "—"}
          </Text>
        </View>
      ) : null}

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    fontSize: 15,
    color: "#c0392b",
    textAlign: "center",
  },
  card: {
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
  },
  meta: {
    fontSize: 15,
    color: "#444",
  },
  backButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  backButtonText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "600",
  },
});
