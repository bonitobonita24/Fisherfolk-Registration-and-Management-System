"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Point } from "geojson";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import {
  CALAPAN_BARANGAY_CENTROIDS,
  CALAPAN_BOUNDS,
} from "@/data/calapan-barangay-centroids";
import { normalizeBarangay } from "@/lib/normalize/barangay";

// Served as a static asset (public/data/...) rather than bundled via a JS
// import — Next.js's default JSON loader only recognizes the ".json"
// extension, so a ".geojson" module import isn't reliably resolvable across
// both webpack and Turbopack. Fetching it client-side avoids that entirely
// and keeps the ~62KB boundary payload out of the JS bundle.
const BOUNDARIES_URL = "/data/calapan-barangays.geojson";

const DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const LIGHT_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const BOUNDARY_SOURCE_ID = "calapan-barangay-boundaries";
const BOUNDARY_LAYER_ID = "calapan-barangay-boundary-lines";
const HEAT_SOURCE_ID = "barangay-density-points";
const HEAT_LAYER_ID = "barangay-density-heat";
const CIRCLE_LAYER_ID = "barangay-density-circles";
const LABEL_LAYER_ID = "barangay-density-labels";

type DisplayMode = "heatmap" | "marks";

type Dataset = "fisherfolk" | "vessels" | "ayuda" | "violations";

const DATASET_LABELS: Record<Dataset, string> = {
  fisherfolk: "Fisherfolk",
  vessels: "Vessels",
  ayuda: "Ayuda",
  violations: "Violations",
};

const DATASET_DESCRIPTIONS: Record<Dataset, string> = {
  fisherfolk:
    "Approximated at barangay centers — exact residence coordinates aren't collected, so each point represents the barangay's registered fisherfolk count.",
  vessels:
    "Geolocated through the vessel's owners — each vessel is placed at its owner's barangay center and counts once per distinct owner barangay.",
  ayuda:
    "Geolocated through the beneficiary — each ayuda beneficiary is placed at their barangay center.",
  violations:
    "Geolocated through the linked fisherfolk — each violation is placed at the violator's barangay center. Free-text violations with no linked fisherfolk are excluded.",
};

interface DensityFeatureProps {
  barangay: string;
  weight: number;
  color: string;
}

// Some stored fisherfolk.barangay strings use abbreviations / spelling variants
// that don't normalize to the canonical centroid keys (Sta./Sto. abbreviations,
// "(Pob.)" suffixes, spacing/spelling drift). Map the known variants (simplified
// form → canonical centroid key) so their counts still land on the map.
// ("San Rafael" is the former name of Salong; "Svs" abbreviates San Vicente
// South — both confirmed by the FMO, so they now resolve to their centroids.)
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

/**
 * Resolve a raw stored barangay string to its canonical centroid key. Falls
 * back to the normalized value when no centroid matches (so the caller can flag
 * genuinely-unmapped barangays).
 */
function resolveCentroidKey(raw: string): string {
  const norm = normalizeBarangay(raw).value ?? raw;
  if (CALAPAN_BARANGAY_CENTROIDS[norm] != null) return norm;
  return BARANGAY_ALIASES[simplifyBarangay(raw)] ?? norm;
}

function buildPointFeatures(
  weightByBarangay: Map<string, number>,
  colorByBarangay: Map<string, string>,
): FeatureCollection<Point, DensityFeatureProps> {
  const features: FeatureCollection<
    Point,
    DensityFeatureProps
  >["features"] = [];

  for (const [barangay, centroid] of Object.entries(
    CALAPAN_BARANGAY_CENTROIDS,
  )) {
    const weight = weightByBarangay.get(barangay) ?? 0;
    if (weight <= 0) continue;
    features.push({
      type: "Feature",
      properties: {
        barangay,
        weight,
        color: colorByBarangay.get(barangay) ?? "hsl(190 80% 55%)",
      },
      geometry: { type: "Point", coordinates: [centroid.lon, centroid.lat] },
    });
  }

  return { type: "FeatureCollection", features };
}

export function BarangayDensityMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const { resolvedTheme } = useTheme();

  const [dataset, setDataset] = useState<Dataset>("fisherfolk");
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("heatmap");
  const [activeSubgroupIds, setActiveSubgroupIds] = useState<Set<string>>(
    new Set(),
  );
  const [allSelected, setAllSelected] = useState(true);
  const [unmatchedBarangays, setUnmatchedBarangays] = useState<string[]>([]);

  const { data: density, isLoading: densityLoading } =
    trpc.dashboard.getBarangayDensity.useQuery({ dataset });

  useEffect(() => setMounted(true), []);

  // Switching the dataset resets the master toggle back on so the new dataset
  // starts fully-shown (the subgroup set refills once its density loads below).
  useEffect(() => {
    setAllSelected(true);
  }, [dataset]);

  // Default every subgroup to "on" once the active dataset's density loads.
  useEffect(() => {
    if (density == null) return;
    setActiveSubgroupIds(new Set(density.subgroups.map((s) => s.id)));
  }, [density]);

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
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // Intentionally init once; theme swaps are handled via setStyle below.
  }, [mounted]);

  // Keep the map sized to its (now flex-filled) container — the card stretches
  // to match the right-column tile stack, so height is not a fixed value.
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
    // effects below to re-run once the new style has loaded by toggling
    // mapReady off then back on.
    setMapReady(false);
    void map.once("styledata", () => setMapReady(true));
  }, [resolvedTheme, mapReady]);

  // ── Derived: per-barangay weight + color from selected subgroups ───────
  const subgroupColorById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of density?.subgroups ?? []) m.set(s.id, s.color);
    return m;
  }, [density]);

  const { weightByBarangay, colorByBarangay } = useMemo(() => {
    const weights = new Map<string, number>();
    const colors = new Map<string, string>();
    const rows = density?.barangays ?? [];
    // NOTE: must be gated on `allSelected` alone. Falling back to "show all"
    // whenever activeSubgroupIds is empty (the previous behavior) meant
    // deliberately switching every subgroup off was indistinguishable from
    // "nothing chosen yet" and silently re-enabled every subgroup's data —
    // the root cause of the heatmap still rendering with everything toggled
    // off.
    const useAll = allSelected;
    // When exactly one subgroup is active, color marks by that subgroup's
    // color; otherwise fall back to the default accent.
    const singleColor =
      !useAll && activeSubgroupIds.size === 1
        ? (subgroupColorById.get([...activeSubgroupIds][0] ?? "") ??
          "#38bdf8")
        : null;

    for (const row of rows) {
      const weight = useAll
        ? row.total
        : row.bySubgroup
            .filter((bc) => activeSubgroupIds.has(bc.id))
            .reduce((sum, bc) => sum + bc.count, 0);
      if (weight <= 0) continue;
      // Key by the CANONICAL centroid key so it joins to the map (stored
      // barangay strings vary in casing / suffix / spelling). Sum in case two
      // raw spellings resolve to the same barangay.
      const key = resolveCentroidKey(row.barangay);
      weights.set(key, (weights.get(key) ?? 0) + weight);
      colors.set(key, singleColor ?? "#38bdf8");
    }
    return { weightByBarangay: weights, colorByBarangay: colors };
  }, [density, allSelected, activeSubgroupIds, subgroupColorById]);

  // Track barangays present in density data but missing a centroid — surface
  // for data-quality visibility (dev console only, not shown in UI chrome).
  useEffect(() => {
    if (density == null) return;
    const missing = density.barangays
      .map((row) => {
        const key = resolveCentroidKey(row.barangay);
        return CALAPAN_BARANGAY_CENTROIDS[key] == null ? row.barangay : null;
      })
      .filter((b): b is string => b != null);
    setUnmatchedBarangays(missing);
    if (missing.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        "[BarangayDensityMap] barangays with no centroid match:",
        missing,
      );
    }
  }, [density]);

  // ── Boundary layer ──────────────────────────────────────────────────────
  // Fetched once (from the public/ static asset) and cached in state; the
  // map effect below just adds it as a source once both are ready.
  const [boundaries, setBoundaries] =
    useState<FeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(BOUNDARIES_URL)
      .then((res) => res.json())
      .then((data: FeatureCollection) => {
        if (!cancelled) setBoundaries(data);
      })
      .catch(() => {
        // Boundaries are a visual nicety, not a hard dependency — the
        // heatmap/marks still render on fetch failure.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map == null || !mapReady || boundaries == null) return;

    if (map.getSource(BOUNDARY_SOURCE_ID) == null) {
      map.addSource(BOUNDARY_SOURCE_ID, {
        type: "geojson",
        data: boundaries,
      });
    }
    if (map.getLayer(BOUNDARY_LAYER_ID) == null) {
      map.addLayer({
        id: BOUNDARY_LAYER_ID,
        type: "line",
        source: BOUNDARY_SOURCE_ID,
        layout: {
          visibility: showBoundaries ? "visible" : "none",
        },
        paint: {
          "line-color": "#9ca3af",
          "line-width": 1.25,
          "line-opacity": 0.6,
        },
      });
    }
    map.setLayoutProperty(
      BOUNDARY_LAYER_ID,
      "visibility",
      showBoundaries ? "visible" : "none",
    );
    // The heatmap/circle/label effect (below) can add its layers either
    // before or after this one depending on which async dependency (style
    // load vs. the boundaries fetch) settles first, and `addLayer` always
    // inserts at the current top of the stack. That race made the boundary
    // outline land BENEATH the opaque heat/circle layers roughly half the
    // time, at only 0.35 opacity/1px width — so toggling it back on often
    // rendered nothing perceptible. Pin it to the top of the stack on every
    // run so the toggle's effect is always visible regardless of load order.
    map.moveLayer(BOUNDARY_LAYER_ID);
  }, [mapReady, showBoundaries, boundaries]);

  // ── Heatmap / marks layers ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (map == null || !mapReady) return;

    const geojson = buildPointFeatures(weightByBarangay, colorByBarangay);

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

    if (map.getLayer(CIRCLE_LAYER_ID) == null) {
      map.addLayer({
        id: CIRCLE_LAYER_ID,
        type: "circle",
        source: HEAT_SOURCE_ID,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0,
            5,
            5,
            9,
            25,
            16,
            80,
            26,
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.75,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.5,
        },
      });
    }

    if (map.getLayer(LABEL_LAYER_ID) == null) {
      map.addLayer({
        id: LABEL_LAYER_ID,
        type: "symbol",
        source: HEAT_SOURCE_ID,
        layout: {
          "text-field": ["to-string", ["get", "weight"]],
          "text-size": 11,
          "text-offset": [0, 1.1],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#e5e7eb",
          "text-halo-color": "#111827",
          "text-halo-width": 1,
        },
      });
    }

    // "Heatmap view" chooses the RENDER MODE (heat vs discrete marks); the
    // category toggles choose WHAT DATA shows. With zero categories selected
    // (or all selected categories summing to zero anywhere), geojson has no
    // features — but we also gate visibility explicitly here rather than
    // relying solely on an empty source, so the data layers are unambiguously
    // hidden regardless of render mode.
    const hasData = weightByBarangay.size > 0;
    const heatVisible = hasData && displayMode === "heatmap";
    const marksVisible = hasData && displayMode !== "heatmap";
    map.setLayoutProperty(
      HEAT_LAYER_ID,
      "visibility",
      heatVisible ? "visible" : "none",
    );
    map.setLayoutProperty(
      CIRCLE_LAYER_ID,
      "visibility",
      marksVisible ? "visible" : "none",
    );
    map.setLayoutProperty(
      LABEL_LAYER_ID,
      "visibility",
      marksVisible ? "visible" : "none",
    );
  }, [mapReady, weightByBarangay, colorByBarangay, displayMode]);

  const isLoading = densityLoading;

  function toggleSubgroup(id: string, next: boolean) {
    setAllSelected(false);
    setActiveSubgroupIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }

  function toggleAll(next: boolean) {
    setAllSelected(next);
    if (next && density != null) {
      setActiveSubgroupIds(new Set(density.subgroups.map((s) => s.id)));
    } else if (!next) {
      // Turning the master toggle OFF must also empty the active set. Leaving
      // the previously-full set behind (with allSelected=false) made the weight
      // memo sum every subgroup anyway — so "all toggles off" still rendered the
      // full heatmap. Clearing here makes "off" mean off.
      setActiveSubgroupIds(new Set());
    }
  }

  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="space-y-1 border-b px-6 py-5">
        <CardTitle className="text-sm font-medium">
          {DATASET_LABELS[dataset]} Density Map
        </CardTitle>
        <CardDescription className="text-xs">
          {DATASET_DESCRIPTIONS[dataset]}
          {unmatchedBarangays.length > 0 && (
            <span className="mt-1 block text-amber-500">
              {unmatchedBarangays.length} barangay
              {unmatchedBarangays.length === 1 ? "" : "s"} without a mapped
              location: {unmatchedBarangays.join(", ")}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-6 py-5 lg:min-h-0">
        <div className="relative h-[36rem] w-full overflow-hidden rounded-md border lg:h-full lg:min-h-[28rem]">
          <div ref={containerRef} className="h-full w-full" />

          {/* ── Floating controls ─────────────────────────────────────── */}
          <div className="absolute left-3 top-3 z-10 w-64 rounded-lg border bg-card/95 p-3 shadow-lg backdrop-blur">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="bgy-dataset" className="text-xs font-semibold">
                  Dataset
                </Label>
                <Select
                  value={dataset}
                  onValueChange={(v) => setDataset(v as Dataset)}
                >
                  <SelectTrigger
                    id="bgy-dataset"
                    className="h-8 w-full text-xs"
                    aria-label="Select dataset"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisherfolk">Fisherfolk</SelectItem>
                    <SelectItem value="vessels">Vessels</SelectItem>
                    <SelectItem value="ayuda">Ayuda</SelectItem>
                    <SelectItem value="violations">Violations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="bgy-boundaries" className="text-xs">
                  Boundaries
                </Label>
                <Switch
                  id="bgy-boundaries"
                  checked={showBoundaries}
                  onCheckedChange={setShowBoundaries}
                  aria-label="Toggle Boundaries"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="bgy-marks" className="text-xs">
                  {displayMode === "heatmap" ? "Heatmap" : "Marks"} view
                </Label>
                <Switch
                  id="bgy-marks"
                  checked={displayMode === "marks"}
                  onCheckedChange={(checked) =>
                    setDisplayMode(checked ? "marks" : "heatmap")
                  }
                  aria-label={`Toggle ${displayMode === "marks" ? "Marks" : "Heatmap"} view`}
                />
              </div>

              <div className="border-t pt-2">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <Label htmlFor="bgy-all" className="text-xs font-semibold">
                    All {DATASET_LABELS[dataset]}
                  </Label>
                  <Switch
                    id="bgy-all"
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label={`Toggle All ${DATASET_LABELS[dataset]}`}
                  />
                </div>
                <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                  {(density?.subgroups ?? []).map((sub) => {
                    const isOn = allSelected || activeSubgroupIds.has(sub.id);
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: sub.color }}
                          />
                          <span className="truncate text-xs text-muted-foreground">
                            {sub.name}
                          </span>
                        </div>
                        <Switch
                          checked={isOn}
                          onCheckedChange={(checked) =>
                            toggleSubgroup(sub.id, checked)
                          }
                          aria-label={`Toggle ${sub.name}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40">
              <p className="text-sm text-muted-foreground">Loading map data…</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
