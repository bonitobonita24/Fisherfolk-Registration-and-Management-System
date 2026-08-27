"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Palette } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { hexToHslTriplet, readableForeground } from "@/lib/theme/color";
import type { UserRole } from "@frms/shared/types";

interface ThemePreset {
  name: string;
  primary: string;
  secondary: string;
}

const PRESETS: ThemePreset[] = [
  { name: "Tangerine (default)", primary: "#F97316", secondary: "#1E3A5F" },
  { name: "Ocean", primary: "#0EA5E9", secondary: "#0F172A" },
  { name: "Emerald", primary: "#10B981", secondary: "#064E3B" },
  { name: "Violet", primary: "#7C3AED", secondary: "#2E1065" },
  { name: "Rose", primary: "#E11D48", secondary: "#4C0519" },
  { name: "Slate", primary: "#475569", secondary: "#0F172A" },
];

function samePreset(preset: ThemePreset, primaryColor?: string, secondaryColor?: string): boolean {
  if (!primaryColor || !secondaryColor) return false;
  return (
    preset.primary.toLowerCase() === primaryColor.toLowerCase() &&
    preset.secondary.toLowerCase() === secondaryColor.toLowerCase()
  );
}

// ── ThemeCustomizer component ─────────────────────────────────────────────
export function ThemeCustomizer({ role }: { role: UserRole }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data } = trpc.settings.theme.get.useQuery();

  const update = trpc.settings.theme.update.useMutation({
    onSuccess: () => {
      void utils.settings.theme.get.invalidate();
      router.refresh();
      toast.success("Theme updated.");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update theme.");
    },
  });

  if (role !== "tenant_superadmin" && role !== "tenant_manager") {
    return null;
  }

  function applyPreset(preset: ThemePreset) {
    const root = document.getElementById("tenant-theme-root");
    if (root) {
      root.style.setProperty("--primary", hexToHslTriplet(preset.primary));
      root.style.setProperty("--primary-foreground", readableForeground(preset.primary));
      root.style.setProperty("--ring", hexToHslTriplet(preset.primary));
      root.style.setProperty("--secondary", hexToHslTriplet(preset.secondary));
      root.style.setProperty(
        "--secondary-foreground",
        readableForeground(preset.secondary),
      );
    }
    void update.mutateAsync({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Customize theme">
          <Palette className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Theme</SheetTitle>
          <SheetDescription>
            Preset accent colors apply to everyone in this organization.
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 px-4 py-4">
          {PRESETS.map((preset) => {
            const isCurrent = samePreset(preset, data?.primaryColor, data?.secondaryColor);
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                disabled={update.isPending}
                aria-label={`Apply ${preset.name} theme`}
                className="flex min-h-[44px] flex-col items-start gap-2 rounded-md border border-input p-3 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-5 w-5 rounded-full border border-border"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="h-5 w-5 rounded-full border border-border"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  {isCurrent && <Check className="h-4 w-4 text-primary" />}
                </div>
                <span className="text-xs font-medium">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
