"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  Check,
  Factory,
  Fish,
  Loader2,
  Ship,
  Shell,
  Store,
  Waves,
  X,
} from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoryPickerProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

interface CategoryOption {
  id: string;
  name: string;
  displayColor: string | null;
  iconType: "EMOJI" | "IMAGE" | null;
  iconEmoji: string | null;
  iconImageUrl: string | null;
}

export function CategoryPicker({
  value,
  onValueChange,
  placeholder = "Select categories…",
  disabled = false,
  className,
  id,
}: CategoryPickerProps) {
  const query = trpc.category.list.useQuery({ status: "ACTIVE" });

  const categories = useMemo<CategoryOption[]>(
    () =>
      (query.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        displayColor: c.displayColor,
        iconType: c.iconType,
        iconEmoji: c.iconEmoji,
        iconImageUrl: c.iconImageUrl,
      })),
    [query.data],
  );

  const selected = useMemo(
    () => categories.filter((c) => value.includes(c.id)),
    [categories, value],
  );

  function toggle(categoryId: string) {
    if (value.includes(categoryId)) {
      onValueChange(value.filter((id) => id !== categoryId));
    } else {
      onValueChange([...value, categoryId]);
    }
  }

  function remove(categoryId: string) {
    onValueChange(value.filter((id) => id !== categoryId));
  }

  const buttonLabel =
    selected.length === 0
      ? placeholder
      : `${selected.length} selected`;

  return (
    <div className={cn("space-y-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled || query.isLoading}
            className={cn(
              "w-full justify-between font-normal",
              selected.length === 0 && "text-muted-foreground",
            )}
          >
            <span className="truncate">
              {query.isLoading ? "Loading categories…" : buttonLabel}
            </span>
            {query.isLoading && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] rounded-xl border-border p-0"
          align="start"
        >
          {query.isLoading ? (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : query.isError ? (
            <p className="p-4 text-sm text-destructive">
              Failed to load categories.
            </p>
          ) : categories.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No active categories. Ask an Admin to create categories in
              Settings.
            </p>
          ) : (
            <ScrollArea className="max-h-72">
              <ul className="space-y-0.5 p-1">
                {categories.map((category) => {
                  const checked = value.includes(category.id);
                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        aria-pressed={checked}
                        onClick={() => {
                          toggle(category.id);
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "grid h-4 w-4 shrink-0 place-content-center rounded-sm border",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input",
                          )}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        <CategoryIcon category={category} />
                        <span className="flex-1 truncate">{category.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="flex items-center gap-1.5 rounded-lg pr-1"
              style={
                category.displayColor != null && category.displayColor !== ""
                  ? {
                      borderColor: `${category.displayColor}40`,
                      backgroundColor: `${category.displayColor}1a`,
                    }
                  : undefined
              }
            >
              <CategoryIcon category={category} size={14} />
              <span>{category.name}</span>
              <button
                type="button"
                onClick={() => {
                  remove(category.id);
                }}
                aria-label={`Remove ${category.name}`}
                className="rounded-md p-0.5 hover:bg-foreground/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Lucide icon lookup keyed by normalized category name (lowercase).
// No `slug` field on CategoryOption, so name is the identifier.
const CATEGORY_ICON_MAP: Record<string, typeof Ship> = {
  "boat owner/operator": Ship,
  "boat-owner-operator": Ship,
  "capture fishing": Fish,
  "capture-fishing": Fish,
  gleaning: Shell,
  vendor: Store,
  "fish processing": Factory,
  "fish-processing": Factory,
  aquaculture: Waves,
};

function CategoryIcon({
  category,
  size = 16,
}: {
  category: CategoryOption;
  size?: number;
}) {
  // 1. IMAGE branch — keep unchanged.
  if (
    category.iconType === "IMAGE" &&
    category.iconImageUrl != null &&
    category.iconImageUrl !== ""
  ) {
    return (
      <Image
        src={category.iconImageUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-sm object-cover"
        unoptimized
      />
    );
  }

  // 2. Lucide icon lookup by normalized name.
  //    Covers all iconType values (EMOJI, null, or unknown future types)
  //    so the emoji/tofu branch is intentionally gone.
  const LucideIcon = CATEGORY_ICON_MAP[category.name.toLowerCase()];
  if (LucideIcon != null) {
    return (
      <LucideIcon
        size={size}
        className="text-muted-foreground"
        aria-hidden={true}
      />
    );
  }

  // 3. Unknown / custom category — colored dot fallback.
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        backgroundColor:
          category.displayColor != null && category.displayColor !== ""
            ? category.displayColor
            : "var(--muted)",
      }}
      className="inline-block rounded-sm"
    />
  );
}
