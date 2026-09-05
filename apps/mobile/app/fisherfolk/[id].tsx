import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "@/components/StatusBadge";
import { useTrpc } from "@/lib/auth";

// Inferred from `fisherfolk.verifyByQr` — the `valid: true` branch's payload.
// This screen is READ-ONLY (M1 field staff view); no mutations here.
type VerifiedFisherfolk = Extract<
  Awaited<ReturnType<ReturnType<typeof useTrpc>["fisherfolk"]["verifyByQr"]["query"]>>,
  { valid: true }
>["fisherfolk"];

export default function FisherfolkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trpc = useTrpc();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [record, setRecord] = useState<VerifiedFisherfolk | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);
    trpc.fisherfolk.verifyByQr
      .query({ raw: id })
      .then((res) => {
        if (cancelled) return;
        if (res.valid) {
          setRecord(res.fisherfolk);
        } else {
          setNotFound(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load this record.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, trpc]);

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
