"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { LocateFixed } from "lucide-react";
import {
  CALAPAN_BARANGAY_CENTROIDS,
  CALAPAN_BOUNDS,
} from "@/data/calapan-barangay-centroids";
import { normalizeBarangay } from "@/lib/normalize/barangay";

const DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const LIGHT_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const PICKER_ZOOM = 15;

export interface LocationPickerValue {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: LocationPickerValue | null;
  onChange: (next: LocationPickerValue) => void;
  barangay?: string;
  className?: string;
  disabled?: boolean;
}

/** Resolve a raw barangay string to a centroid, if one exists. */
function resolveBarangayCentroid(
  raw: string | undefined,
): { lat: number; lon: number } | null {
  if (raw == null || raw.trim() === "") return null;
  const norm = normalizeBarangay(raw).value ?? raw;
  return CALAPAN_BARANGAY_CENTROIDS[norm] ?? null;
}

/**
 * Reusable draggable-pin location picker built on MapLibre. Auto-centers on
 * the given barangay's centroid when no value is set yet, so the encoder
 * only has to fine-drag to the exact spot. Falls back to the city bounds
 * when neither a value nor a resolvable barangay is available.
 */
export function LocationPicker({
  value,
  onChange,
  barangay,
  className,
  disabled = false,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  // Keep the latest onChange without re-running the marker-setup effect.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // Intentionally init once; theme swaps are handled via setStyle below.
  }, [mounted]);

  // Keep the map sized to its container. When the picker mounts inside a
  // dialog, the container settles AFTER the map inits (enter animation), so the
  // canvas can be mis-measured and never corrected without a size change — this
  // pushes the top-right NavigationControl off the visible area where
  // `overflow-hidden` clips it below the 24px min target size (WCAG 2.5.8).
  // Force an explicit resize once ready (+ an rAF) in addition to the observer.
  useEffect(() => {
    if (!mapReady) return;
    const el = containerRef.current;
    const map = mapRef.current;
    if (el == null || map == null) return;
    map.resize();
    const raf = requestAnimationFrame(() => map.resize());
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mapReady]);

  // ── Theme swap ───────────────────────────────────────────────────────────
  const prevThemeRef = useRef(resolvedTheme);
  useEffect(() => {
    const map = mapRef.current;
    if (map == null || !mapReady) return;
    if (prevThemeRef.current === resolvedTheme) return;
    prevThemeRef.current = resolvedTheme;
    map.setStyle(resolvedTheme === "light" ? LIGHT_STYLE : DARK_STYLE);
  }, [resolvedTheme, mapReady]);

  // ── Marker setup + auto-center-on-barangay ──────────────────────────────
  const didInitialCenterRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (map == null || !mapReady) return;

    // Resolve the initial pin position: prefer an existing value, else the
    // barangay centroid (only on first placement — don't re-snap the pin
    // back to a barangay centroid if the encoder already moved it), else
    // leave unplaced (fit to city bounds).
    let initial: LocationPickerValue | null = value;
    if (initial == null && !didInitialCenterRef.current) {
      const centroid = resolveBarangayCentroid(barangay);
      if (centroid != null) initial = { lat: centroid.lat, lng: centroid.lon };
    }

    if (initial != null) {
      didInitialCenterRef.current = true;
      if (markerRef.current == null) {
        const marker = new maplibregl.Marker({
          draggable: !disabled,
          color: "#ef4444",
        })
          .setLngLat([initial.lng, initial.lat])
          .addTo(map);
        marker.on("dragend", () => {
          const { lat, lng } = marker.getLngLat();
          onChangeRef.current({ lat, lng });
        });
        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat([initial.lng, initial.lat]);
      }
      map.flyTo({ center: [initial.lng, initial.lat], zoom: PICKER_ZOOM });
    } else {
      map.fitBounds(CALAPAN_BOUNDS, { padding: 24 });
    }
    // Re-run when the barangay changes (to auto-center a still-unset pin) or
    // when the value changes externally (e.g. form reset).
  }, [mapReady, barangay]);

  // Sync marker position when `value` changes from outside (e.g. programmatic
  // reset) without moving the map — the drag/click handlers already call
  // onChange, so this only needs to reconcile external updates.
  useEffect(() => {
    const marker = markerRef.current;
    if (marker == null || value == null) return;
    const current = marker.getLngLat();
    if (
      Math.abs(current.lat - value.lat) > 1e-9 ||
      Math.abs(current.lng - value.lng) > 1e-9
    ) {
      marker.setLngLat([value.lng, value.lat]);
    }
  }, [value]);

  // Keep marker draggable state in sync with `disabled`.
  useEffect(() => {
    markerRef.current?.setDraggable(!disabled);
  }, [disabled]);

  // ── Click-to-move ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (map == null || !mapReady || disabled) return;

    function handleClick(e: maplibregl.MapMouseEvent) {
      const { lat, lng } = e.lngLat;
      didInitialCenterRef.current = true;
      if (markerRef.current == null) {
        const marker = new maplibregl.Marker({ draggable: true, color: "#ef4444" })
          .setLngLat([lng, lat])
          .addTo(map!);
        marker.on("dragend", () => {
          const pos = marker.getLngLat();
          onChangeRef.current({ lat: pos.lat, lng: pos.lng });
        });
        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat([lng, lat]);
      }
      onChangeRef.current({ lat, lng });
    }

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [mapReady, disabled]);

  function useMyLocation() {
    setGeoError(null);
    if (typeof window === "undefined" || !window.isSecureContext) {
      setGeoError("Location requires a secure (https) connection.");
      return;
    }
    if (
      typeof navigator === "undefined" ||
      navigator.geolocation == null
    ) {
      setGeoError("Geolocation is not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        didInitialCenterRef.current = true;
        onChangeRef.current(next);
        const map = mapRef.current;
        if (map != null) {
          if (markerRef.current == null) {
            const marker = new maplibregl.Marker({
              draggable: !disabled,
              color: "#ef4444",
            })
              .setLngLat([next.lng, next.lat])
              .addTo(map);
            marker.on("dragend", () => {
              const p = marker.getLngLat();
              onChangeRef.current({ lat: p.lat, lng: p.lng });
            });
            markerRef.current = marker;
          } else {
            markerRef.current.setLngLat([next.lng, next.lat]);
          }
          map.flyTo({ center: [next.lng, next.lat], zoom: PICKER_ZOOM });
        }
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied."
            : "Couldn't determine your location.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className={className}>
      <div className="relative h-80 w-full overflow-hidden rounded-md border">
        <div ref={containerRef} className="h-full w-full" />
        {!disabled && (
          <div className="absolute right-3 top-3 z-10">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="shadow-lg"
              onClick={useMyLocation}
            >
              <LocateFixed className="mr-1.5 size-3.5" />
              Use my location
            </Button>
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {value != null
            ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
            : "No location set"}
        </span>
        {geoError != null && (
          <span className="text-destructive">{geoError}</span>
        )}
      </div>
    </div>
  );
}
