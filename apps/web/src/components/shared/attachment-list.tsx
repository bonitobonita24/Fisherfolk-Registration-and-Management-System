"use client";

import Image from "next/image";
import { FileIcon, X } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface AttachmentItem {
  id?: string;
  filePath: string;
  originalFilename: string;
  mimeType: string;
}

interface AttachmentListProps {
  attachments: AttachmentItem[];
  className?: string;
  emptyText?: string;
  onRemove?: (item: AttachmentItem) => void;
}

/** Inner component — one hook call per item, avoids conditional hook in a loop. */
function AttachmentThumb({
  item,
  onRemove,
}: {
  item: AttachmentItem;
  onRemove?: (item: AttachmentItem) => void;
}) {
  const isImage = item.mimeType.startsWith("image/");

  const { data, isLoading } = trpc.upload.getDownloadUrl.useQuery(
    { key: item.filePath },
    { staleTime: 30 * 60 * 1000 },
  );

  const url = data?.url;

  if (isLoading || !url) {
    return (
      <div className="flex h-8 items-center">
        <span className="text-xs text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="relative inline-block">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          aria-label={`Open ${item.originalFilename} in new tab`}
        >
          <div className="relative aspect-square h-32 overflow-hidden rounded-md border border-border bg-muted">
            <Image
              src={url}
              alt={item.originalFilename}
              fill
              sizes="128px"
              className="object-cover"
              unoptimized
            />
          </div>
        </a>
        {onRemove !== undefined && (
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 shadow hover:bg-destructive/10"
            aria-label={`Remove ${item.originalFilename}`}
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }

  // PDF / non-image: bordered row with link
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate hover:underline"
        aria-label={`Download ${item.originalFilename}`}
      >
        {item.originalFilename}
      </a>
      <Badge variant="secondary" className="shrink-0 text-xs">
        PDF
      </Badge>
      {onRemove !== undefined && (
        <button
          type="button"
          onClick={() => onRemove(item)}
          className="ml-1 rounded p-0.5 hover:bg-muted"
          aria-label={`Remove ${item.originalFilename}`}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function AttachmentList({
  attachments,
  className,
  emptyText,
  onRemove,
}: AttachmentListProps) {
  if (attachments.length === 0) {
    return emptyText ? (
      <p className="text-sm text-muted-foreground">{emptyText}</p>
    ) : null;
  }

  const images = attachments.filter((a) => a.mimeType.startsWith("image/"));
  const others = attachments.filter((a) => !a.mimeType.startsWith("image/"));

  return (
    <div className={cn("space-y-3", className)}>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((item) => (
            <AttachmentThumb
              key={item.filePath}
              item={item}
              {...(onRemove !== undefined ? { onRemove } : {})}
            />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <ul className="space-y-2">
          {others.map((item) => (
            <li key={item.filePath}>
              <AttachmentThumb
                item={item}
                {...(onRemove !== undefined ? { onRemove } : {})}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
