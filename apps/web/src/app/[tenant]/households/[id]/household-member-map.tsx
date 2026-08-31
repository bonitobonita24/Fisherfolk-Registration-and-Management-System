"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Crown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  CALAPAN_BARANGAY_CENTROIDS,
  CALAPAN_BOUNDS,
} from "@/data/calapan-barangay-centroids";
import { normalizeBarangay } from "@/lib/normalize/barangay";

const DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const LIGHT_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

// Small deterministic per-barangay jitter radius (degrees) so multiple
// members sharing one barangay centroid don't fully overlap. Barangay-level
// only — exact GPS residence isn't collected (owner-approved, matches
// BarangayDensityMap's centroid-based approximation).
const JITTER_RADIUS_DEG = 0.0018;

export interface HouseholdMemberMapMember {
  id: string;
  fullName: string;
  barangay: string;
  isHead: boolean;
}

export interface HouseholdMemberMapProps {
  members: HouseholdMemberMapMember[];
  headBarangay: string;
}

/** Resolve a raw stored barangay string to its canonical centroid key. */
function resolveCentroidKey(raw: string): string {
  const norm = normalizeBarangay(raw).value ?? raw;
  return CALAPAN_BARANGAY_CENTROIDS[norm] != null ? norm : norm;
}

/** Deterministic [0,1) hash of a string (djb2 variant) — stable across renders/SSR. */
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  // Force unsigned, then normalize to [0, 1).
  return (hash >>> 0) / 4294967296;
}

/** Deterministic small lat/lon offset derived from the member's id. */
function jitterFor(id: string): { dLat: number; dLon: number } {
  const angle = hashString(id) * 2 * Math.PI;
  const magnitude = hashString(`${id}:r`) * JITTER_RADIUS_DEG;
  return {
    dLat: Math.sin(angle) * magnitude,
    dLon: Math.cos(angle) * magnitude,
  };
}

const HEAD_COLOR = "#eab308"; // gold
const SAME_BARANGAY_COLOR = "#38bdf8"; // sky blue
const DIFFERENT_BARANGAY_COLOR = "#f59e0b"; // amber warning

/**
 * Self-contained, presentational barangay-level map of a household's
 * members. Plots each member at their barangay's centroid (with a small
 * deterministic jitter so co-located members don't fully overlap), marks the
 * head distinctly, and flags members outside the head's barangay in a
 * warning color. Mirrors BarangayDensityMap's MapLibre init/theme/resize
 * patterns.
 */
export default function HouseholdMemberMap({
  members,
  headBarangay,
}: HouseholdMemberMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mounted, setMounted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  // ── Map init (once) ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    if (containerRef.current == null) return;
    if (mapRef.current != null) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: resolvedTheme === "light" ? LIGHT_STYLE : DARK_STYLE,
      bounds: CALAPAN_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    map.on("load", () => setMapReady(true));

    mapRef.current = map;

    return () => {
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // Intentionally init once; theme swaps are handled via setStyle below.
  }, [mounted]);

  // Keep the map sized to its (flex-filled) container.
  useEffect(() => {
    if (!mapReady) return;
    const el = containerRef.current;
    const map = mapRef.current;
    if (el == null || map == null) return;
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [mapReady]);

  // ── Theme swap ───────────────────────────────────────────────────────────
  const prevThemeRef = useRef(resolvedTheme);
  useEffect(() => {
    const map = mapRef.current;
    if (map == null || !mapReady) return;
    if (prevThemeRef.current === resolvedTheme) return;
    prevThemeRef.current = resolvedTheme;
    map.setStyle(resolvedTheme === "light" ? LIGHT_STYLE : DARK_STYLE);
    setMapReady(false);
    void map.once("styledata", () => setMapReady(true));
  }, [resolvedTheme, mapReady]);

  // ── Member markers ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (map == null || !mapReady) return;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];

    const normalizedHead =
      normalizeBarangay(headBarangay).value ?? headBarangay;

    for (const member of members) {
      const centroidKey = resolveCentroidKey(member.barangay);
      const centroid = CALAPAN_BARANGAY_CENTROIDS[centroidKey];
      if (centroid == null) continue;

      const { dLat, dLon } = jitterFor(member.id);
      const lat = centroid.lat + dLat;
      const lon = centroid.lon + dLon;

      const sameBarangay =
        (normalizeBarangay(member.barangay).value ?? member.barangay) ===
        normalizedHead;

      const el = document.createElement("div");
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.title = `${member.fullName} — ${member.barangay}`;

      if (member.isHead) {
        el.style.width = "28px";
        el.style.height = "28px";
        el.style.borderRadius = "9999px";
        el.style.backgroundColor = HEAD_COLOR;
        el.style.border = "2px solid #ffffff";
        el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";
        // Render a lucide Crown icon into the marker element.
        el.innerHTML = renderCrownSvg();
      } else {
        el.style.width = "16px";
        el.style.height = "16px";
        el.style.borderRadius = "9999px";
        el.style.backgroundColor = sameBarangay
          ? SAME_BARANGAY_COLOR
          : DIFFERENT_BARANGAY_COLOR;
        el.style.border = "2px solid #ffffff";
        el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.35)";
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lon, lat])
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [mapReady, members, headBarangay]);

  return (
    <Card className="flex h-full min-h-96 flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="space-y-1 border-b px-6 py-5">
        <CardTitle className="text-sm font-medium">
          Household Member Locations
        </CardTitle>
        <CardDescription className="text-xs">
          Approximated at barangay centers — exact residence coordinates
          aren&apos;t collected.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-6 py-5 lg:min-h-0">
        <div className="relative h-96 w-full overflow-hidden rounded-md border lg:h-full lg:min-h-[24rem]">
          <div ref={containerRef} className="h-full w-full" />

          <div className="absolute bottom-3 left-3 z-10 rounded-lg border bg-card/95 p-2.5 shadow-lg backdrop-blur">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="flex size-4 shrink-0 items-center justify-center rounded-full border border-white"
                  style={{ backgroundColor: HEAD_COLOR }}
                >
                  <Crown className="size-2.5 text-white" />
                </span>
                <span className="text-xs text-muted-foreground">
                  Household head
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full border border-white"
                  style={{ backgroundColor: SAME_BARANGAY_COLOR }}
                />
                <span className="text-xs text-muted-foreground">
                  Same barangay
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full border border-white"
                  style={{ backgroundColor: DIFFERENT_BARANGAY_COLOR }}
                />
                <span className="text-xs text-muted-foreground">
                  Different barangay
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Inline SVG matching lucide-react's Crown icon, for injection into a MapLibre HTML marker. */
function renderCrownSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/></svg>`;
}
