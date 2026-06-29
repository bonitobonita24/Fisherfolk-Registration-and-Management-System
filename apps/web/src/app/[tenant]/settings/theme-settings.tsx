"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { hexToHslTriplet, readableForeground } from "@/lib/theme/color";

// Keep in sync with the settings router defaults
const DEFAULT_PRIMARY = "#F97316";
const DEFAULT_SECONDARY = "#1E3A5F";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function isValidHex(hex: string): boolean {
  return HEX_RE.test(hex);
}

// ── ThemeSettings component ───────────────────────────────────────────────────
export function ThemeSettings() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.settings.theme.get.useQuery();

  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(DEFAULT_SECONDARY);

  // Seed local state from server data once it loads
  useEffect(() => {
    if (data) {
      setPrimary(data.primaryColor);
      setSecondary(data.secondaryColor);
    }
  }, [data]);

  // Live preview: push CSS vars onto the tenant root whenever state changes
  useEffect(() => {
    if (!isValidHex(primary) || !isValidHex(secondary)) return;
    const root = document.getElementById("tenant-theme-root");
    if (root) {
      root.style.setProperty("--primary", hexToHslTriplet(primary));
      root.style.setProperty("--primary-foreground", readableForeground(primary));
      root.style.setProperty("--ring", hexToHslTriplet(primary));
      root.style.setProperty("--secondary", hexToHslTriplet(secondary));
      root.style.setProperty(
        "--secondary-foreground",
        readableForeground(secondary),
      );
    }
  }, [primary, secondary]);

  const update = trpc.settings.theme.update.useMutation({
    onSuccess: () => {
      void utils.settings.theme.get.invalidate();
      router.refresh();
      toast.success("Accent colors saved.");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to save accent colors.");
    },
  });

  function handleSave() {
    void update.mutateAsync({ primaryColor: primary, secondaryColor: secondary });
  }

  function handleReset() {
    setPrimary(DEFAULT_PRIMARY);
    setSecondary(DEFAULT_SECONDARY);
  }

  const saveDisabled =
    update.isPending || !isValidHex(primary) || !isValidHex(secondary);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accent Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-9 w-full rounded bg-muted" />
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-9 w-full rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Accent Colors</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set the primary (orange) and secondary (navy) accent colors for
          your organization. Changes apply to everyone in this tenant. The
          dark background is unaffected.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── Primary color row ──────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="primary-hex">Primary color (orange)</Label>
          <div className="flex items-center gap-3">
            <input
              id="primary-color"
              type="color"
              value={isValidHex(primary) ? primary : DEFAULT_PRIMARY}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-9 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5"
              aria-label="Primary color picker"
            />
            <Input
              id="primary-hex"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              placeholder="#F97316"
              pattern="^#[0-9a-fA-F]{6}$"
              className="font-mono"
              aria-label="Primary color hex value"
            />
          </div>
          {primary && !isValidHex(primary) && (
            <p className="text-xs text-destructive">
              Must be a 6-digit hex color, e.g. #F97316
            </p>
          )}
        </div>

        {/* ── Secondary color row ────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="secondary-hex">Secondary color (navy)</Label>
          <div className="flex items-center gap-3">
            <input
              id="secondary-color"
              type="color"
              value={isValidHex(secondary) ? secondary : DEFAULT_SECONDARY}
              onChange={(e) => setSecondary(e.target.value)}
              className="h-9 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5"
              aria-label="Secondary color picker"
            />
            <Input
              id="secondary-hex"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              placeholder="#1E3A5F"
              pattern="^#[0-9a-fA-F]{6}$"
              className="font-mono"
              aria-label="Secondary color hex value"
            />
          </div>
          {secondary && !isValidHex(secondary) && (
            <p className="text-xs text-destructive">
              Must be a 6-digit hex color, e.g. #1E3A5F
            </p>
          )}
        </div>

        {/* ── Live preview strip ─────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Preview</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              Primary
            </span>
            <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              Secondary
            </span>
          </div>
        </div>

        {/* ── Action buttons ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saveDisabled}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={update.isPending}
          >
            Reset to default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
