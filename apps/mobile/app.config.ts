// Branding, app icon, and splash screen are PLACEHOLDERS pending owner decision.
// Distribution model (owner-set, FIS-37): self-hosted / downloadable sideloaded APK only —
// no App Store / Play Store submission. See README.md.
import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "FRMS Field",
  slug: "frms-field",
  scheme: "frmsfield",
  version: "0.28.0",
  orientation: "portrait",
  newArchEnabled: true,
  ios: {
    bundleIdentifier: "ph.gov.calapan.frms",
  },
  android: {
    package: "ph.gov.calapan.frms",
  },
  plugins: ["expo-router", "expo-secure-store", "expo-camera", "expo-location"],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
  },
};

export default config;
