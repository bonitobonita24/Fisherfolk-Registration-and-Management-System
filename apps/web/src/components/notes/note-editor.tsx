"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { NoteImage } from "./note-image-extension";
import { SlashCommand } from "./slash-command";

export interface NoteMediaDraft {
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  blockId?: string;
}

export interface NoteEditorHandle {
  getJSON: () => Record<string, unknown>;
  getText: () => string;
  getMedia: () => NoteMediaDraft[];
  isEmpty: () => boolean;
}

interface NoteEditorProps {
  /** Default true — a read-only instance renders the same doc without the slash menu/toolbar. */
  editable?: boolean;
  initialContent?: JSONContent | Record<string, unknown> | null;
  /** Prefills the media-key → metadata map so an edit session keeps existing attachments resolvable. */
  initialMedia?: NoteMediaDraft[] | undefined;
  className?: string;
  ariaLabel?: string;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * FIS-36 Field Diary Phase 1 rich-text note editor. Wraps TipTap 3.31 with a
 * StarterKit + TaskList/TaskItem + a custom Image node (resolves an opaque
 * storage KEY to a URL at render time) + a "/" slash command for formatting
 * (headings, lists, quote, divider, task, insert photo). `immediatelyRender:
 * false` avoids the Next.js App Router SSR hydration mismatch TipTap 3 warns
 * about for client components rendered during the server pass.
 */
export const NoteEditor = forwardRef<NoteEditorHandle, NoteEditorProps>(
  function NoteEditor(
    { editable = true, initialContent, initialMedia, className, ariaLabel },
    ref,
  ) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Tracks every image storageKey ever inserted this session (+ prefilled
    // from initialMedia in edit mode) so getMedia() can attach the right
    // filename/mimeType/fileSize when a matching image node is found in the
    // current doc. Keyed by storageKey.
    const mediaMapRef = useRef<Map<string, NoteMediaDraft>>(
      new Map((initialMedia ?? []).map((m) => [m.storageKey, m])),
    );

    const uploadMutation = trpc.upload.uploadFile.useMutation();

    function requestPhotoInsert() {
      fileInputRef.current?.click();
    }

    const editor = useEditor(
      {
        immediatelyRender: false,
        editable,
        extensions: [
          StarterKit,
          TaskList,
          TaskItem.configure({ nested: true }),
          NoteImage.configure({ inline: false, allowBase64: false }),
          ...(editable
            ? [SlashCommand.configure({ onRequestPhotoInsert: requestPhotoInsert })]
            : []),
        ],
        content: initialContent ?? "",
        editorProps: {
          attributes: {
            class: cn(
              "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
              "min-h-[240px] px-3 py-2",
            ),
            "aria-label": ariaLabel ?? "Note content",
          },
        },
      },
      [editable],
    );

    function collectImageKeys(node: JSONContent, out: Set<string>): void {
      const src: unknown = node.attrs?.["src"];
      if (node.type === "image" && typeof src === "string") {
        out.add(src);
      }
      for (const child of node.content ?? []) {
        collectImageKeys(child, out);
      }
    }

    useImperativeHandle(ref, () => ({
      getJSON: () => (editor ? editor.getJSON() : {}) as Record<string, unknown>,
      getText: () => (editor ? editor.getText() : ""),
      isEmpty: () => (editor ? editor.isEmpty : true),
      getMedia: () => {
        if (!editor) return [];
        const keys = new Set<string>();
        collectImageKeys(editor.getJSON() as JSONContent, keys);
        const out: NoteMediaDraft[] = [];
        for (const key of keys) {
          const meta = mediaMapRef.current.get(key);
          if (meta) out.push(meta);
        }
        return out;
      },
    }));

    function handleFileSelected(file: File) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Only JPEG, PNG, or WEBP images are allowed.");
        return;
      }
      if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
        toast.error("Image must be 1 byte to 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          toast.error("Could not read the selected file.");
          return;
        }
        setIsUploadingImage(true);
        uploadMutation.mutate(
          {
            base64: result,
            mimeType: file.type,
            originalFilename: file.name,
            entityType: "note-photo",
          },
          {
            onSuccess: (data) => {
              mediaMapRef.current.set(data.key, {
                storageKey: data.key,
                originalFilename: file.name,
                mimeType: data.mimeType,
                fileSize: data.sizeBytes,
              });
              editor?.chain().focus().setImage({ src: data.key, alt: file.name }).run();
            },
            onError: (error) => {
              toast.error(`Photo upload failed: ${error.message}`);
            },
            onSettled: () => setIsUploadingImage(false),
          },
        );
      };
      reader.onerror = () => toast.error("Could not read the selected file.");
      reader.readAsDataURL(file);
    }

    return (
      <div
        className={cn(
          "rounded-md border border-input bg-background",
          editable && "focus-within:ring-1 focus-within:ring-ring",
          className,
        )}
      >
        {editable && (
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFileSelected(file);
              event.target.value = "";
            }}
          />
        )}
        {editable && (
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
            <span>
              Type <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">/</kbd>{" "}
              for formatting commands.
            </span>
            {isUploadingImage && (
              <span className="flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                Uploading photo…
              </span>
            )}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    );
  },
);
