"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Crown } from "lucide-react";
import type { FeatureCollection, LineString, Point } from "geojson";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc/client";
import {
  CALAPAN_BARANGAY_CENTROIDS,
  CALAPAN_BOUNDS,
} from "@/data/calapan-barangay-centroids";
import { normalizeBarangay } from "@/lib/normalize/barangay";

// Served as a static asset (public/data/...) — see BarangayDensityMap for why
// this is fetched client-side rather than bundled as a JS import.
const BOUNDARIES_URL = "/data/calapan-barangays.geojson";

const DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const LIGHT_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const OUTLINE_SOURCE_ID = "municipal-barangay-outline-source";
const OUTLINE_LAYER_ID = "municipal-barangay-outline-lines";
const LINE_SOURCE_ID = "household-connection-source";
const LINE_LAYER_ID = "household-connection-lines";
const MEMBER_SOURCE_ID = "household-member-points-source";
const MEMBER_LAYER_ID = "household-member-points-circles";
const HEAT_SOURCE_ID = "household-count-heat-source";
const HEAT_LAYER_ID = "household-count-heat-layer";

// Small deterministic jitter radius (degrees) so households/members sharing a
// barangay centroid fan out instead of fully overlapping. Barangay-level
// only — exact GPS residence isn't collected (owner-approved, matches
// BarangayDensityMap / HouseholdMemberMap's centroid-based approximation).
const JITTER_RADIUS_DEG = 0.0022;

const HEAD_COLOR = "#eab308"; // gold
const CONNECTED_COLOR = "#38bdf8"; // sky blue
const JUMPED_COLOR = "#EC4899"; // pink — distinct from the amber "warning" palette

interface NetworkMember {
  id: string;
  fullName: string;
  barangay: string;
  latitude?: number | null;
  longitude?: number | null;
}

/** Real captured GPS coords when present, else centroid + deterministic jitter. */
function resolveLocation(
  member: NetworkMember,
): { lat: number; lon: number } | null {
  if (member.latitude != null && member.longitude != null) {
    return { lat: member.latitude, lon: member.longitude };
  }
  const key = resolveCentroidKey(member.barangay);
  const centroid = CALAPAN_BARANGAY_CENTROIDS[key];
  if (centroid == null) return null;
  const { dLat, dLon } = jitterFor(member.id);
  return { lat: centroid.lat + dLat, lon: centroid.lon + dLon };
}

interface NetworkHousehold {
  id: string;
  householdNumber: string;
  head: NetworkMember;
  members: NetworkMember[];
}

interface LineProps {
  jumped: boolean;
}

interface MemberPointProps {
  jumped: boolean;
  fullName: string;
  barangay: string;
}

interface HeatPointProps {
  barangay: string;
  weight: number;
}

type DisplayMode = "network" | "heatmap";

/** Deterministic [0,1) hash of a string (djb2 variant) — stable across renders/SSR. */
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0) / 4294967296;
}

/** Deterministic small lat/lon offset derived from an id, so repeated calls fan out. */
function jitterFor(id: string): { dLat: number; dLon: number } {
  const angle = hashString(id) * 2 * Math.PI;
  const magnitude = hashString(`${id}:r`) * JITTER_RADIUS_DEG;
  return {
    dLat: Math.sin(angle) * magnitude,
    dLon: Math.cos(angle) * magnitude,
  };
}

// Known raw-barangay spelling/abbreviation variants that don't normalize to a
// canonical centroid key. Mirrors BarangayDensityMap's alias table.
const BARANGAY_ALIASES: Record<string, string> = {
  wawa: "Sabang",
  "nag-iba i": "Nag-iba I",
  "nag-iba ii": "Nag-iba II",
  "mahal na pangalan": "Mahal na Pangalan",
  calero: "Calero",
  "sto niño": "Santo Niño",
  communal: "Comunal",
  lumangbayan: "Lumang Bayan",
  "sta rita": "Santa Rita",
  "sta isabel": "Santa Isabel",
  "san rafael": "Salong",
  svs: "San Vicente South",
};

function simplifyBarangay(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveCentroidKey(raw: string): string {
  const norm = normalizeBarangay(raw).value ?? raw;
  if (CALAPAN_BARANGAY_CENTROIDS[norm] != null) return norm;
  return BARANGAY_ALIASES[simplifyBarangay(raw)] ?? norm;
}

/** Inline SVG matching lucide-react's Crown icon, for injection into a MapLibre HTML marker. */
function renderCrownSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/></svg>`;
}

/**
 * Municipal household interconnection map (FIS-24). Plots every household's
 * head (with a lucide Crown marker) at its barangay centroid, draws a
 * connection line to each member's barangay centroid, and flags members who
 * "jumped" to a different barangay than their head in a warning color.
 * Barangay-level only — no GPS is collected. Mirrors BarangayDensityMap's
 * MapLibre init/theme/resize patterns.
 */
export function MunicipalNetworkMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const headMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [mounted, setMounted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("network");
  const { resolvedTheme } = useTheme();

  const { data: households, isLoading } = trpc.householdNetwork.list.useQuery();

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
      for (const marker of headMarkersRef.current) marker.remove();
      headMarkersRef.current = [];
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
    // A style swap discards all sources/layers — force the layer-setup
    // effects below to re-run once the new style has loaded.
    setMapReady(false);
    void map.once("styledata", () => setMapReady(true));
  }, [resolvedTheme, mapReady]);

  // ── Municipal outline (all barangay polygons, unified line layer) ──────
  const [boundaries, setBoundaries] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(BOUNDARIES_URL)
      .then((res) => res.json())
      .then((data: FeatureCollection) => {
        if (!cancelled) setBoundaries(data);
      })
      .catch(() => {
        // The outline is a visual nicety, not a hard dependency.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map == null || !mapReady || boundaries == null) return;

    if (map.getSource(OUTLINE_SOURCE_ID) == null) {
      map.addSource(OUTLINE_SOURCE_ID, { type: "geojson", data: boundaries });
    }
    if (map.getLayer(OUTLINE_LAYER_ID) == null) {
      map.addLayer({
        id: OUTLINE_LAYER_ID,
        type: "line",
        source: OUTLINE_SOURCE_ID,
        paint: {
          "line-color": "#9ca3af",
          "line-width": 1,
          "line-opacity": 0.5,
        },
      });
    }
  }, [mapReady, boundaries]);

  // ── Derived: heads / members / connection lines ─────────────────────────
  const { heads, memberFeatures, lineFeatures } = useMemo(() => {
    const headsOut: Array<{
      household: NetworkHousehold;
      lat: number;
      lon: number;
    }> = [];
    const memberFeaturesOut: Array<
      GeoJSON.Feature<Point, MemberPointProps>
    > = [];
    const lineFeaturesOut: Array<GeoJSON.Feature<LineString, LineProps>> = [];

    for (const household of households ?? []) {
      const headLocation = resolveLocation(household.head);
      if (headLocation == null) continue;
      const { lat: headLat, lon: headLon } = headLocation;
      headsOut.push({ household, lat: headLat, lon: headLon });

      const normalizedHeadBarangay =
        normalizeBarangay(household.head.barangay).value ??
        household.head.barangay;

      for (const member of household.members) {
        if (member.id === household.head.id) continue;

        const memberLocation = resolveLocation(member);
        if (memberLocation == null) continue;
        const { lat: memberLat, lon: memberLon } = memberLocation;

        const jumped =
          (normalizeBarangay(member.barangay).value ?? member.barangay) !==
          normalizedHeadBarangay;

        memberFeaturesOut.push({
          type: "Feature",
          properties: { jumped, fullName: member.fullName, barangay: member.barangay },
          geometry: { type: "Point", coordinates: [memberLon, memberLat] },
        });

        lineFeaturesOut.push({
          type: "Feature",
          properties: { jumped },
          geometry: {
            type: "LineString",
            coordinates: [
              [headLon, headLat],
              [memberLon, memberLat],
            ],
          },
        });
      }
    }

    return {
      heads: headsOut,
      memberFeatures: memberFeaturesOut,
      lineFeatures: lineFeaturesOut,
    };
  }, [households]);

  // ── Derived: household count per barangay (heatmap weight) ─────────────
  // Weighted by HOUSEHOLD count — one count per household, keyed off the
  // head's barangay (a household "lives" wherever its head is registered).
  const heatFeatures = useMemo(() => {
    const counts = new Map<string, number>();
    for (const household of households ?? []) {
      const key = resolveCentroidKey(household.head.barangay);
      if (CALAPAN_BARANGAY_CENTROIDS[key] == null) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const features: Array<GeoJSON.Feature<Point, HeatPointProps>> = [];
    for (const [barangay, weight] of counts) {
      const centroid = CALAPAN_BARANGAY_CENTROIDS[barangay];
      if (centroid == null) continue;
      features.push({
        type: "Feature",
        properties: { barangay, weight },
        geometry: { type: "Point", coordinates: [centroid.lon, centroid.lat] },
      });
    }
    return features;
  }, [households]);

  // ── Connection lines ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (map == null || !mapReady) return;

    const geojson: FeatureCollection<LineString, LineProps> = {
      type: "FeatureCollection",
      features: lineFeatures,
    };

    const source = map.getSource<maplibregl.GeoJSONSource>(LINE_SOURCE_ID);
    if (source == null) {
      map.addSource(LINE_SOURCE_ID, { type: "geojson", data: geojson });
    } else {
      source.setData(geojson);
    }

    if (map.getLayer(LINE_LAYER_ID) == null) {
      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: LINE_SOURCE_ID,
        paint: {
          "line-color": [
            "case",
            ["get", "jumped"],
            JUMPED_COLOR,
            CONNECTED_COLOR,
          ],
          "line-width": 1.25,
          "line-opacity": 0.55,
        },
      });
    }
    map.setLayoutProperty(
      LINE_LAYER_ID,
      "visibility",
      displayMode === "network" ? "visible" : "none",
    );
  }, [mapReady, lineFeatures, displayMode]);

  // ── Member points (GeoJSON layer — efficient at municipal scale) ────────
  useEffect(() => {
    const map = mapRef.current;
    if (map == null || !mapReady) return;

    const geojson: FeatureCollection<Point, MemberPointProps> = {
      type: "FeatureCollection",
      features: memberFeatures,
    };

    const source = map.getSource<maplibregl.GeoJSONSource>(MEMBER_SOURCE_ID);
    if (source == null) {
      map.addSource(MEMBER_SOURCE_ID, { type: "geojson", data: geojson });
    } else {
      source.setData(geojson);
    }

    if (map.getLayer(MEMBER_LAYER_ID) == null) {
      map.addLayer({
        id: MEMBER_LAYER_ID,
        type: "circle",
        source: MEMBER_SOURCE_ID,
        paint: {
          "circle-radius": ["case", ["get", "jumped"], 5, 3.5],
          "circle-color": [
            "case",
            ["get", "jumped"],
            JUMPED_COLOR,
            CONNECTED_COLOR,
          ],
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.6,
        },
      });
    }
    map.setLayoutProperty(
      MEMBER_LAYER_ID,
      "visibility",
      displayMode === "network" ? "visible" : "none",
    );
  }, [mapReady, memberFeatures, displayMode]);

  // ── Household-count heatmap (barangays weighted by household count) ────
  useEffect(() => {
    const map = mapRef.current;
    if (map == null || !mapReady) return;

    const geojson: FeatureCollection<Point, HeatPointProps> = {
      type: "FeatureCollection",
      features: heatFeatures,
    };

    const source = map.getSource<maplibregl.GeoJSONSource>(HEAT_SOURCE_ID);
    if (source == null) {
      map.addSource(HEAT_SOURCE_ID, { type: "geojson", data: geojson });
    } else {
      source.setData(geojson);
    }

    if (map.getLayer(HEAT_LAYER_ID) == null) {
      map.addLayer({
        id: HEAT_LAYER_ID,
        type: "heatmap",
        source: HEAT_SOURCE_ID,
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0,
            0,
            1,
            0.3,
            5,
            0.6,
            50,
            1,
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            1.2,
            14,
            3,
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            18,
            14,
            42,
          ],
          "heatmap-opacity": 0.8,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.1,
            "rgba(56,189,248,0.35)",
            0.3,
            "rgba(56,189,248,0.65)",
            0.5,
            "rgba(250,204,21,0.75)",
            0.75,
            "rgba(251,146,60,0.85)",
            1,
            "rgba(239,68,68,0.95)",
          ],
        },
      });
    }
    map.setLayoutProperty(
      HEAT_LAYER_ID,
      "visibility",
      displayMode === "heatmap" ? "visible" : "none",
    );
  }, [mapReady, heatFeatures, displayMode]);

  // ── Head markers (DOM markers — Crown icon, one per household) ─────────
  useEffect(() => {
    const map = mapRef.current;
    if (map == null || !mapReady) return;

    for (const marker of headMarkersRef.current) marker.remove();
    headMarkersRef.current = [];

    for (const { household, lat, lon } of heads) {
      const el = document.createElement("div");
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.width = "22px";
      el.style.height = "22px";
      el.style.borderRadius = "9999px";
      el.style.backgroundColor = HEAD_COLOR;
      el.style.border = "2px solid #ffffff";
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";
      el.title = `${household.head.fullName} — ${household.householdNumber} (${household.head.barangay})`;
      el.innerHTML = renderCrownSvg();

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lon, lat])
        .addTo(map);
      headMarkersRef.current.push(marker);
    }
  }, [mapReady, heads]);

  // Head markers are DOM elements (not a MapLibre layer), so the heatmap
  // toggle hides/shows them directly rather than via setLayoutProperty.
  useEffect(() => {
    const visible = displayMode === "network";
    for (const marker of headMarkersRef.current) {
      marker.getElement().style.display = visible ? "flex" : "none";
    }
  }, [displayMode, heads]);

  // ── Keyboard-accessible list alternative (WCAG 2.1.1 / 4.1.2) ───────────
  // The Crown head markers are DOM pins that aren't keyboard-focusable and
  // share a generic accessible name; this list surfaces the same household
  // points as real, uniquely-labelled, focusable buttons alongside the map.
  function flyToHousehold(lat: number, lon: number) {
    const map = mapRef.current;
    if (map == null) return;
    map.flyTo({ center: [lon, lat], zoom: Math.max(map.getZoom(), 14) });
  }

  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="space-y-1 border-b px-6 py-5">
        <CardTitle className="text-sm font-medium">
          Municipal Household Network
        </CardTitle>
        <CardDescription className="text-xs">
          Every household head connected to its members, approximated at
          barangay centers — exact residence coordinates aren&apos;t
          collected.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-6 py-5 lg:min-h-0">
        <div className="relative h-full min-h-[28rem] w-full overflow-hidden rounded-md border">
          <div ref={containerRef} className="h-full w-full" />

          <div className="absolute left-3 top-3 z-10 rounded-lg border bg-card/95 p-2.5 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="network-heatmap-toggle" className="text-xs">
                {displayMode === "heatmap" ? "Heatmap" : "Network"} view
              </Label>
              <Switch
                id="network-heatmap-toggle"
                checked={displayMode === "heatmap"}
                onCheckedChange={(checked) =>
                  setDisplayMode(checked ? "heatmap" : "network")
                }
                aria-label={`Toggle ${displayMode === "network" ? "Heatmap" : "Network"} view`}
              />
            </div>
          </div>

          {displayMode === "network" ? (
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
                    style={{ backgroundColor: CONNECTED_COLOR }}
                  />
                  <span className="text-xs text-muted-foreground">
                    Connected member
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full border border-white"
                    style={{ backgroundColor: JUMPED_COLOR }}
                  />
                  <span className="text-xs text-muted-foreground">
                    Jumped barangay
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute bottom-3 left-3 z-10 rounded-lg border bg-card/95 p-2.5 shadow-lg backdrop-blur">
              <p className="text-xs text-muted-foreground">
                Barangays weighted by household count — hotter areas have more
                registered households.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40">
              <p className="text-sm text-muted-foreground">
                Loading network…
              </p>
            </div>
          )}
        </div>

        <div
          role="region"
          aria-label="Map locations (list view)"
          className="mt-3 rounded-md border"
        >
          <h3 className="border-b px-3 py-2 text-xs font-medium">
            Household locations (list view)
          </h3>
          <ScrollArea className="h-40">
            <ul className="divide-y">
              {heads.map(({ household, lat, lon }) => (
                <li key={household.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start rounded-none px-3 py-2 text-left text-xs font-normal"
                    onClick={() => flyToHousehold(lat, lon)}
                  >
                    {household.head.fullName} — {household.householdNumber} (
                    {household.head.barangay})
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
