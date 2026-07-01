"use client";

import { AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react";
import { type IdElement } from "@frms/shared/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface ElementInspectorProps {
  element: IdElement;
  onChange: (updated: IdElement) => void;
  onDelete: () => void;
}

export function ElementInspector({
  element,
  onChange,
  onDelete,
}: ElementInspectorProps) {
  function patchMm(key: "xMm" | "yMm" | "widthMm" | "heightMm", raw: string) {
    const num = parseFloat(raw);
    if (!isNaN(num)) onChange({ ...element, [key]: num });
  }

  function patchZIndex(raw: string) {
    const num = parseInt(raw, 10);
    if (!isNaN(num)) onChange({ ...element, zIndex: num });
  }

  const idBase = `el-${element.id}`;

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {element.type}
          {element.type === "variable"
            ? ` · ${element.variableKey.replace(/[{}]/g, "")}`
            : ""}
        </p>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete element"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Separator />

      {/* Position & size */}
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["X (mm)", "xMm"],
            ["Y (mm)", "yMm"],
            ["W (mm)", "widthMm"],
            ["H (mm)", "heightMm"],
          ] as [string, "xMm" | "yMm" | "widthMm" | "heightMm"][]
        ).map(([label, key]) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={`${idBase}-${key}`} className="text-xs">
              {label}
            </Label>
            <Input
              id={`${idBase}-${key}`}
              type="number"
              step={0.1}
              value={element[key].toFixed(1)}
              onChange={(e) => patchMm(key, e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${idBase}-zIndex`} className="text-xs">
          Z-Index
        </Label>
        <Input
          id={`${idBase}-zIndex`}
          type="number"
          step={1}
          value={element.zIndex}
          onChange={(e) => patchZIndex(e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      {/* Text content — only for "text" type */}
      {element.type === "text" && (
        <>
          <Separator />
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-content`} className="text-xs">
              Text Content
            </Label>
            <Input
              id={`${idBase}-content`}
              value={element.content}
              onChange={(e) =>
                onChange({ ...element, content: e.target.value })
              }
              className="h-7 text-xs"
            />
          </div>
        </>
      )}

      {/* Typography — text and variable share these fields */}
      {(element.type === "text" || element.type === "variable") && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor={`${idBase}-fontFamily`} className="text-xs">
                Font Family
              </Label>
              <Input
                id={`${idBase}-fontFamily`}
                value={element.fontFamily}
                onChange={(e) =>
                  onChange({ ...element, fontFamily: e.target.value })
                }
                className="h-7 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor={`${idBase}-fontSize`} className="text-xs">
                  Size (pt)
                </Label>
                <Input
                  id={`${idBase}-fontSize`}
                  type="number"
                  step={0.5}
                  min={4}
                  value={element.fontSizePt}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= 1) onChange({ ...element, fontSizePt: v });
                  }}
                  className="h-7 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`${idBase}-fontWeight`} className="text-xs">
                  Weight
                </Label>
                <Select
                  value={String(element.fontWeight)}
                  onValueChange={(v) =>
                    onChange({
                      ...element,
                      fontWeight: parseInt(v, 10) as 400 | 500 | 600 | 700,
                    })
                  }
                >
                  <SelectTrigger
                    id={`${idBase}-fontWeight`}
                    className="h-7 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Regular</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="600">Semibold</SelectItem>
                    <SelectItem value="700">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Color */}
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  aria-label="Pick color"
                  value={element.color}
                  onChange={(e) =>
                    onChange({ ...element, color: e.target.value })
                  }
                  className="h-7 w-8 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <Input
                  aria-label="Hex color"
                  value={element.color}
                  maxLength={7}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      onChange({ ...element, color: e.target.value });
                    }
                  }}
                  className="h-7 flex-1 font-mono text-xs"
                />
              </div>
            </div>

            {/* Align */}
            <div className="space-y-1">
              <Label className="text-xs">Align</Label>
              <div
                className="flex gap-1"
                role="group"
                aria-label="Text alignment"
              >
                {(
                  [
                    { value: "left", icon: AlignLeft, label: "Align left" },
                    {
                      value: "center",
                      icon: AlignCenter,
                      label: "Align center",
                    },
                    { value: "right", icon: AlignRight, label: "Align right" },
                  ] as const
                ).map(({ value, icon: Icon, label }) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={element.align === value ? "secondary" : "outline"}
                    className="h-7 flex-1 px-0"
                    onClick={() => onChange({ ...element, align: value })}
                    aria-pressed={element.align === value}
                    aria-label={label}
                  >
                    <Icon className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Icon emoji — only for "icon" type */}
      {element.type === "icon" && (
        <>
          <Separator />
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-emoji`} className="text-xs">
              Emoji
            </Label>
            <Input
              id={`${idBase}-emoji`}
              value={element.emoji ?? ""}
              onChange={(e) =>
                onChange({ ...element, emoji: e.target.value })
              }
              placeholder="e.g. 🎣"
              className="h-7 text-xs"
            />
          </div>
        </>
      )}
    </div>
  );
}
