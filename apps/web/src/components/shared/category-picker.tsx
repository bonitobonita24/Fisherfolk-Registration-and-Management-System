"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
          className="w-[--radix-popover-trigger-width] p-0"
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
              <ul className="py-1">
                {categories.map((category) => {
                  const checked = value.includes(category.id);
                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        onClick={() => {
                          toggle(category.id);
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        <Checkbox checked={checked} aria-hidden tabIndex={-1} />
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
              className="flex items-center gap-1.5 pr-1"
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
                className="rounded-sm p-0.5 hover:bg-foreground/10"
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

function CategoryIcon({
  category,
  size = 16,
}: {
  category: CategoryOption;
  size?: number;
}) {
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
  if (
    category.iconType === "EMOJI" &&
    category.iconEmoji != null &&
    category.iconEmoji !== ""
  ) {
    return (
      <span style={{ fontSize: size }} aria-hidden>
        {category.iconEmoji}
      </span>
    );
  }
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
