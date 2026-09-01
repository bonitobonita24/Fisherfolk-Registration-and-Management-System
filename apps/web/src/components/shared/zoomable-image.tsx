"use client";

import { useCallback, useRef, useState, type WheelEvent } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ZoomableImageProps {
  src: string;
  alt: string;
  thumbnailClassName: string;
  enlargedClassName?: string;
  ariaLabel: string;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.5;

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

/**
 * Thumbnail that opens a large, zoomable enlarged view in a Dialog when
 * clicked. Shared version of the pattern originally inlined in
 * fisherfolk-detail-client.tsx — kept identical so both call sites render
 * consistently. Do not fork this logic back into a page-local copy.
 */
export function ZoomableImage({
  src,
  alt,
  thumbnailClassName,
  enlargedClassName,
  ariaLabel,
}: ZoomableImageProps) {
  const [scale, setScale] = useState(1);
  const lastWheelRef = useRef(0);

  const zoomIn = useCallback(() => {
    setScale((prev) => clampScale(prev + SCALE_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => clampScale(prev - SCALE_STEP));
  }, []);

  const reset = useCallback(() => {
    setScale(1);
  }, []);

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    // Throttle slightly so trackpads don't fire dozens of events per gesture.
    const now = Date.now();
    if (now - lastWheelRef.current < 30) return;
    lastWheelRef.current = now;
    event.preventDefault();
    setScale((prev) =>
      clampScale(prev + (event.deltaY < 0 ? SCALE_STEP / 2 : -SCALE_STEP / 2)),
    );
  }, []);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "block cursor-zoom-in rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <img src={src} alt={alt} className={thumbnailClassName} />
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] w-fit max-w-[min(90vw,900px)] flex-col items-center gap-3 border-none bg-transparent p-0 shadow-none sm:max-w-[min(90vw,900px)]">
        <DialogTitle className="sr-only">{ariaLabel}</DialogTitle>
        <div
          className="relative flex max-h-[80vh] w-full items-center justify-center overflow-hidden rounded-lg bg-background/95 p-4 shadow-lg"
          onWheel={handleWheel}
        >
          <img
            src={src}
            alt={alt}
            style={{ transform: `scale(${scale})` }}
            className={cn(
              enlargedClassName ??
                "max-h-[72vh] max-w-full rounded-lg object-contain",
              "select-none transition-transform duration-150 ease-out",
            )}
            draggable={false}
          />
        </div>
        <div className="flex items-center gap-1 rounded-full border bg-background/95 px-2 py-1 shadow-lg">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Zoom out"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-[3.5rem] text-center text-xs font-medium tabular-nums text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Zoom in"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Reset zoom"
            onClick={reset}
            disabled={scale === 1}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <span className="ml-1 max-w-[10rem] truncate border-l pl-2 text-xs text-muted-foreground">
            {ariaLabel}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
