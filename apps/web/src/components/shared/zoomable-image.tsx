"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ZoomableImageProps {
  src: string;
  alt: string;
  thumbnailClassName: string;
  enlargedClassName?: string;
  ariaLabel: string;
}

/**
 * Thumbnail that opens an enlarged view in a Dialog when clicked.
 * Shared version of the pattern originally inlined in
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
  return (
    <Dialog>
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
      <DialogContent className="flex max-h-[85vh] w-fit max-w-[90vw] items-center justify-center border-none bg-transparent p-0 shadow-none sm:max-w-[90vw]">
        <img
          src={src}
          alt={alt}
          className={
            enlargedClassName ??
            "max-h-[85vh] max-w-full rounded-lg object-contain"
          }
        />
      </DialogContent>
    </Dialog>
  );
}
