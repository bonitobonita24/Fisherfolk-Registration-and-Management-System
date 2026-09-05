import { StyleSheet, Text, View } from "react-native";

// Color lookup for known FisherfolkStatus values (packages/shared FisherfolkStatus:
// NEW, ACTIVE, RENEWED, INACTIVE, ARCHIVED). Kept as a plain string prop (not the
// enum type) so this component stays reusable for any status-like string, with a
// neutral fallback for anything unrecognized (e.g. a server-added value like EXPIRED).
const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  NEW: { bg: "#dcfce7", fg: "#166534" },
  RENEWED: { bg: "#dcfce7", fg: "#166534" },
  ACTIVE: { bg: "#dbeafe", fg: "#1e40af" },
  EXPIRED: { bg: "#fee2e2", fg: "#991b1b" },
  INACTIVE: { bg: "#f3f4f6", fg: "#4b5563" },
  ARCHIVED: { bg: "#f3f4f6", fg: "#4b5563" },
};

const FALLBACK_COLOR = { bg: "#f3f4f6", fg: "#4b5563" };

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? FALLBACK_COLOR;

  return (
    <View
      style={[styles.badge, { backgroundColor: color.bg }]}
      accessibilityLabel={`Status: ${status}`}
    >
      <Text style={[styles.text, { color: color.fg }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
});
