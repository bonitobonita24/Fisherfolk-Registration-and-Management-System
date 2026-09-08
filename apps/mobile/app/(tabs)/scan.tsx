import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBadge } from "@/components/StatusBadge";
import { useTrpc } from "@/lib/auth";
import { useCan } from "@/lib/permissions";

// Inferred from `fisherfolk.verifyByQr` — the `valid: true` branch's payload.
type VerifiedFisherfolk = Extract<
  Awaited<ReturnType<ReturnType<typeof useTrpc>["fisherfolk"]["verifyByQr"]["query"]>>,
  { valid: true }
>["fisherfolk"];

export default function ScanScreen() {
  const trpc = useTrpc();
  const { can } = useCan();
  const permission_gated = !can("fisherfolk", "view");
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [result, setResult] = useState<VerifiedFisherfolk | null>(null);

  function reset() {
    scannedRef.current = false;
    setError(null);
    setNotFound(false);
    setResult(null);
  }

  async function handleScanned(data: string) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await trpc.fisherfolk.verifyByQr.query({ raw: data });
      if (res.valid) {
        setResult(res.fisherfolk);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify this code.");
    } finally {
      setLoading(false);
    }
  }

  // Cosmetic-only gate (server remains authoritative) — don't even request
  // camera permission if this role can't view fisherfolk records.
  if (permission_gated) {
    return (
      <View style={styles.center}>
        <Text style={styles.message} accessibilityRole="header">
          No access
        </Text>
        <Text style={styles.message}>
          Your role can&apos;t view fisherfolk records.
        </Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera access is needed to scan QR codes.</Text>
        <Pressable
          style={styles.button}
          onPress={() => {
            void requestPermission();
          }}
          accessibilityRole="button"
          accessibilityLabel="Grant camera access"
        >
          <Text style={styles.buttonText}>Grant camera access</Text>
        </Pressable>
        <Link href="/search" label="Search manually instead" />
      </View>
    );
  }

  if (loading || error || notFound || result) {
    return (
      <View style={styles.center}>
        {loading ? <ActivityIndicator size="large" /> : null}

        {error ? (
          <>
            <Text style={styles.errorText} accessibilityRole="alert">
              {error}
            </Text>
            <Pressable
              style={styles.button}
              onPress={reset}
              accessibilityRole="button"
              accessibilityLabel="Scan again"
            >
              <Text style={styles.buttonText}>Scan again</Text>
            </Pressable>
          </>
        ) : null}

        {notFound ? (
          <>
            <Text style={styles.message}>Not found — not registered in this tenant.</Text>
            <Pressable
              style={styles.button}
              onPress={reset}
              accessibilityRole="button"
              accessibilityLabel="Scan again"
            >
              <Text style={styles.buttonText}>Scan again</Text>
            </Pressable>
          </>
        ) : null}

        {result ? (
          <View style={styles.card}>
            <Text style={styles.name} accessibilityRole="header">
              {result.fullName}
            </Text>
            <StatusBadge status={result.status} />
            <Text style={styles.meta}>Barangay: {result.barangay ?? "—"}</Text>
            <Text style={styles.meta}>
              Registration year: {result.registrationYear ?? "—"}
            </Text>
            <Pressable
              style={styles.button}
              onPress={reset}
              accessibilityRole="button"
              accessibilityLabel="Scan again"
            >
              <Text style={styles.buttonText}>Scan again</Text>
            </Pressable>
          </View>
        ) : null}

        <Link href="/search" label="Search manually" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={(event) => {
          void handleScanned(event.data);
        }}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Point the camera at a fisherfolk QR code</Text>
        <Link href="/search" label="Search manually" light />
      </View>
    </View>
  );
}

function Link({
  href,
  label,
  light,
}: {
  href: "/search";
  label: string;
  light?: boolean;
}) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={styles.link}
    >
      <Text style={[styles.linkText, light && styles.linkTextLight]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#fff",
    gap: 16,
  },
  overlay: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 12,
  },
  overlayText: {
    color: "#fff",
    fontSize: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    color: "#c0392b",
  },
  card: {
    width: "100%",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
  },
  meta: {
    fontSize: 14,
    color: "#444",
  },
  button: {
    backgroundColor: "#1d4ed8",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  link: {
    paddingVertical: 6,
  },
  linkText: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "600",
  },
  linkTextLight: {
    color: "#fff",
  },
});
