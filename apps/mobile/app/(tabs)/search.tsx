import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBadge } from "@/components/StatusBadge";
import { useTrpc } from "@/lib/auth";
import { useCan } from "@/lib/permissions";

const DEBOUNCE_MS = 350;

export default function SearchScreen() {
  const trpc = useTrpc();
  const { can } = useCan();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const {
    data,
    isLoading: loading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["fisherfolk", "list", debounced],
    enabled: debounced.length > 0,
    queryFn: () => trpc.fisherfolk.list.query({ search: debounced, limit: 25 }),
  });

  const results = data?.items ?? [];
  const error = isError
    ? queryError instanceof Error
      ? queryError.message
      : "Search failed."
    : null;

  // Cosmetic-only gate (server remains authoritative) — hide the search UI
  // entirely if this role can't view fisherfolk records.
  if (!can("fisherfolk", "view")) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message} accessibilityRole="header">
          No access
        </Text>
        <Text style={styles.message}>
          Your role can&apos;t view fisherfolk records.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Search fisherfolk
      </Text>

      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search name or ID number"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Search name or ID number"
      />

      <Pressable
        onPress={() => router.push("/scan")}
        accessibilityRole="link"
        accessibilityLabel="Scan a QR code"
        style={styles.link}
      >
        <Text style={styles.linkText}>Scan a QR code</Text>
      </Pressable>

      {loading ? <ActivityIndicator style={styles.spinner} /> : null}

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {!loading && !error && debounced.length > 0 && results.length === 0 ? (
        <Text style={styles.empty}>No matches</Text>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push({ pathname: "/fisherfolk/[id]", params: { id: item.id } })}
            accessibilityRole="button"
            accessibilityLabel={`View ${item.fullName}`}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowName}>{item.fullName}</Text>
              <Text style={styles.rowMeta}>{item.barangay ?? "—"}</Text>
            </View>
            <StatusBadge status={item.status} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#fff",
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fafafa",
    marginBottom: 8,
  },
  link: {
    marginBottom: 16,
  },
  linkText: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "600",
  },
  spinner: {
    marginBottom: 12,
  },
  errorText: {
    color: "#c0392b",
    fontSize: 14,
    marginBottom: 12,
  },
  empty: {
    color: "#888",
    fontSize: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  rowText: {
    flexShrink: 1,
    paddingRight: 12,
  },
  rowName: {
    fontSize: 16,
    fontWeight: "600",
  },
  rowMeta: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
});
