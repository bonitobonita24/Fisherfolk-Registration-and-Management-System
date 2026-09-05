"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SlashCommandItem {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  run: () => void;
}

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export interface SlashCommandMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * FIS-36 slash-command popup. Mounted OUTSIDE the normal React tree via
 * TipTap's `ReactRenderer` + the Suggestion plugin's managed `mount()`
 * (floating-ui positioning, no extra dep). Because focus stays in the
 * ProseMirror editor while "/" is typed, keyboard nav (↑/↓/Enter/Esc) is
 * driven externally through `onKeyDown` (exposed via ref) rather than cmdk's
 * own focus-based listener — this is a lightweight list styled to match the
 * app's shadcn popover/command visual language (bg-popover, border,
 * rounded-md, shadow-md), not the `<Command>` primitive itself, since cmdk
 * expects to own keyboard focus.
 */
export const SlashCommandMenu = forwardRef<SlashCommandMenuHandle, SlashCommandMenuProps>(
  function SlashCommandMenu({ items, command }, ref) {
    const [selected, setSelected] = useState(0);

    useEffect(() => setSelected(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown(event: KeyboardEvent) {
        if (items.length === 0) return false;
        if (event.key === "ArrowDown") {
          setSelected((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === "ArrowUp") {
          setSelected((i) => (i - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          const item = items[selected];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div
          className="w-72 rounded-md border border-border bg-popover p-3 text-sm text-muted-foreground shadow-md"
          role="listbox"
        >
          No matching commands.
        </div>
      );
    }

    return (
      <div
        className="max-h-80 w-72 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        role="listbox"
        aria-label="Formatting commands"
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              role="option"
              aria-selected={index === selected}
              onMouseEnter={() => setSelected(index)}
              onClick={() => command(item)}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
                index === selected
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="flex flex-col">
                <span className="font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );
  },
);
