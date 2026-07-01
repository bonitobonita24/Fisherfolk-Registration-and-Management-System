"use client";

import { Type, Camera, PenLine, QrCode, Variable } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TEMPLATE_VARIABLES, type IdElement } from "@frms/shared/schemas";

/** Safe cross-context ID generator — falls back for non-HTTPS dev envs where randomUUID is unavailable */
function uid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

interface ElementPaletteProps {
  onAddElement: (element: IdElement) => void;
}

const DEFAULT_FONT = {
  fontFamily: "Arial, sans-serif",
  fontSizePt: 8,
  fontWeight: 400 as const,
  color: "#000000",
  align: "left" as const,
};

const DEFAULT_SIZE = { widthMm: 30, heightMm: 8, xMm: 5, yMm: 5, rotation: 0, zIndex: 1 };

export function ElementPalette({ onAddElement }: ElementPaletteProps) {
  function addText() {
    onAddElement({
      id: uid(),
      type: "text",
      content: "Text",
      ...DEFAULT_SIZE,
      ...DEFAULT_FONT,
    });
  }

  function addPhoto() {
    onAddElement({
      id: uid(),
      type: "photo",
      xMm: 5, yMm: 5,
      widthMm: 20, heightMm: 25,
      rotation: 0, zIndex: 1,
    });
  }

  function addSignature() {
    onAddElement({
      id: uid(),
      type: "signature",
      xMm: 5, yMm: 5,
      widthMm: 35, heightMm: 8,
      rotation: 0, zIndex: 1,
    });
  }

  function addQr() {
    onAddElement({
      id: uid(),
      type: "qr",
      xMm: 5, yMm: 5,
      widthMm: 18, heightMm: 18,
      rotation: 0, zIndex: 1,
    });
  }

  function addVariable(key: string) {
    onAddElement({
      id: uid(),
      type: "variable",
      variableKey: key,
      xMm: 5,
      yMm: 5,
      widthMm: 40,
      heightMm: 6,
      rotation: 0,
      zIndex: 1,
      ...DEFAULT_FONT,
    });
  }

  const grouped = {
    FISHERFOLK: TEMPLATE_VARIABLES.filter((v) => v.group === "FISHERFOLK"),
    VESSEL: TEMPLATE_VARIABLES.filter((v) => v.group === "VESSEL"),
    SHARED: TEMPLATE_VARIABLES.filter((v) => v.group === "SHARED"),
  } as const;

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
        Elements
      </p>

      {/* Static element buttons */}
      <div className="grid grid-cols-2 gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs justify-start"
          onClick={addText}
        >
          <Type className="h-3.5 w-3.5" />
          Text
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs justify-start"
          onClick={addPhoto}
        >
          <Camera className="h-3.5 w-3.5" />
          Photo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs justify-start"
          onClick={addSignature}
        >
          <PenLine className="h-3.5 w-3.5" />
          Signature
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs justify-start"
          onClick={addQr}
        >
          <QrCode className="h-3.5 w-3.5" />
          QR Code
        </Button>
      </div>

      <Separator />

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
        Variables
      </p>

      <ScrollArea className="flex-1 -mx-1 px-1">
        {(["FISHERFOLK", "VESSEL", "SHARED"] as const).map((group) => (
          <div key={group} className="mb-3">
            <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase">
              {group.charAt(0) + group.slice(1).toLowerCase()}
            </p>
            <div className="flex flex-col gap-0.5">
              {grouped[group].map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors w-full"
                  onClick={() => addVariable(v.key)}
                >
                  <Variable className="h-3 w-3 shrink-0 text-muted-foreground" />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
