"use client";

import Image from "@tiptap/extension-image";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Loader2, ImageOff } from "lucide-react";

import { trpc } from "@/lib/trpc/client";

/**
 * FIS-36 Field Diary — inline note images store an opaque storage KEY (not a
 * direct URL) in the `src` attribute, matching the tRPC upload contract
 * (`upload.uploadFile` returns `{ key }`; `upload.getDownloadUrl({ key })`
 * resolves it to a signed/proxied URL). This NodeView resolves that key to a
 * real URL at render time — one `getDownloadUrl` query per image node,
 * cached 30 min by react-query so repeated renders (list re-mounts, doc
 * re-parses) don't re-fetch.
 */
function NoteImageNodeView({ node, selected }: ReactNodeViewProps) {
  const storageKey = typeof node.attrs["src"] === "string" ? node.attrs["src"] : "";
  const alt = typeof node.attrs["alt"] === "string" ? node.attrs["alt"] : "";

  const { data, isLoading, isError } = trpc.upload.getDownloadUrl.useQuery(
    { key: storageKey },
    { enabled: storageKey.length > 0, staleTime: 30 * 60 * 1000 },
  );

  return (
    <NodeViewWrapper
      as="span"
      className={`inline-block max-w-full align-top ${selected ? "ring-2 ring-ring rounded-md" : ""}`}
    >
      {isLoading && (
        <span className="flex h-40 w-56 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading image…</span>
        </span>
      )}
      {!isLoading && (isError || !data?.url) && (
        <span className="flex h-40 w-56 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-destructive/40 bg-destructive/5 text-xs text-destructive">
          <ImageOff className="size-5" aria-hidden="true" />
          Image unavailable
        </span>
      )}
      {!isLoading && data?.url && (
        // Plain <img>, not next/image: `src` is an opaque signed/proxy URL
        // resolved per-node at render time — next/image optimization doesn't apply.
        <img
          src={data.url}
          alt={alt || "Note attachment"}
          className="max-h-96 w-auto rounded-md border border-border object-contain"
          draggable={false}
        />
      )}
    </NodeViewWrapper>
  );
}

export const NoteImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(NoteImageNodeView);
  },
});
