"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  /** Real captured GPS coordinates, when present — preferred over the barangay-centroid fallback. */
  latitude?: number | null;
  longitude?: number | null;
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

/** Resolve a member's plotted [lat, lon] — real GPS when present, else barangay centroid + jitter. */
function resolveMemberPosition(
  member: HouseholdMemberMapMember,
): { lat: number; lon: number } | null {
  if (member.latitude != null && member.longitude != null) {
    return { lat: member.latitude, lon: member.longitude };
  }
  const centroidKey = resolveCentroidKey(member.barangay);
  const centroid = CALAPAN_BARANGAY_CENTROIDS[centroidKey];
  if (centroid == null) return null;
  const { dLat, dLon } = jitterFor(member.id);
  return { lat: centroid.lat + dLat, lon: centroid.lon + dLon };
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
  // Unlike BarangayDensityMap (a full-height route page), this card sits in a
  // `lg:self-start` grid cell — its ancestor chain doesn't stretch to a
  // definite height the way a full-height flex/grid page does, so on first
  // paint the container can still measure 0px tall (grid/flex layout not yet
  // settled). MapLibre bakes its WebGL render-buffer size in at construction
  // time; creating the map against a 0-height container leaves it stuck
  // rendering into a 0x0 buffer even after the container's CSS min-height
  // kicks in — the ResizeObserver below only reacts to a *change*, and going
  // from "never measured" to "settled" isn't always reported as one. Guard
  // creation until the container has real pixels, retrying across a few
  // animation frames, so init never races the layout.
  useEffect(() => {
    if (!mounted) return;
    if (mapRef.current != null) return;

    let cancelled = false;
    let rafId: number | null = null;

    function tryInit(attemptsLeft: number) {
      if (cancelled) return;
      const el = containerRef.current;
      if (el == null) return;

      if (el.clientHeight === 0 && attemptsLeft > 0) {
        rafId = requestAnimationFrame(() => tryInit(attemptsLeft - 1));
        return;
      }

      const map = new maplibregl.Map({
        container: el,
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

      // Belt-and-suspenders resize: even with the size-guard above, force a
      // resize once tiles have loaded and once more a beat later, in case
      // the grid cell's height still settles a frame or two after init
      // (e.g. sibling content in the left column reflowing).
      map.on("load", () => {
        map.resize();
        requestAnimationFrame(() => map.resize());
        setTimeout(() => map.resize(), 150);
        setMapReady(true);
      });

      mapRef.current = map;
    }

    tryInit(20);

    return () => {
      cancelled = true;
      if (rafId != null) cancelAnimationFrame(rafId);
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
      mapRef.current?.remove();
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
      const position = resolveMemberPosition(member);
      if (position == null) continue;
      const { lat, lon } = position;

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

  // ── Keyboard-accessible list alternative (WCAG 2.1.1 / 4.1.2) ───────────
  // The map's markers are raster/DOM pins that aren't keyboard-focusable and
  // share a generic accessible name. This list surfaces the same points as
  // real, uniquely-labelled, focusable buttons alongside the map.
  const listPoints = useMemo(
    () =>
      members
        .map((member) => {
          const position = resolveMemberPosition(member);
          if (position == null) return null;
          return { member, ...position };
        })
        .filter(
          (entry): entry is { member: HouseholdMemberMapMember; lat: number; lon: number } =>
            entry != null,
        ),
    [members],
  );

  function flyToMember(lat: number, lon: number) {
    const map = mapRef.current;
    if (map == null) return;
    map.flyTo({ center: [lon, lat], zoom: Math.max(map.getZoom(), 14) });
  }

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

        <div
          role="region"
          aria-label="Map locations (list view)"
          className="mt-3 rounded-md border"
        >
          <h3 className="border-b px-3 py-2 text-xs font-medium">
            Member locations (list view)
          </h3>
          <ScrollArea className="h-32">
            <ul className="divide-y">
              {listPoints.map(({ member, lat, lon }) => (
                <li key={member.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start rounded-none px-3 py-2 text-left text-xs font-normal"
                    onClick={() => flyToMember(lat, lon)}
                  >
                    {member.fullName} — {member.barangay}
                    {member.isHead ? " (Household head)" : ""}
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

/** Inline SVG matching lucide-react's Crown icon, for injection into a MapLibre HTML marker. */
function renderCrownSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/></svg>`;
}
