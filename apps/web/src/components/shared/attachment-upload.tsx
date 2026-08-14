"use client";

import { useRef, useState } from "react";
import { FileIcon, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const ACCEPTED_ATTR = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export interface UploadedAttachment {
  filePath: string; // storage key returned as data.key
  originalFilename: string;
  mimeType: string;
  fileSize: number;
}

interface AttachmentUploadProps {
  entityType: "violation-evidence" | "ayuda-upload" | "kanban-attachment";
  value: UploadedAttachment[];
  onChange: (next: UploadedAttachment[]) => void;
  disabled?: boolean;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentUpload({
  entityType,
  value,
  onChange,
  disabled = false,
  className,
}: AttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const uploadMutation = trpc.upload.uploadFile.useMutation();

  const isUploading = uploadingCount > 0;
  const isDisabled = disabled || isUploading;

  async function handleFile(
    file: File,
    _currentValue: UploadedAttachment[],
  ): Promise<UploadedAttachment | null> {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      const msg = `${file.name}: unsupported type (JPEG, PNG, WEBP, PDF only)`;
      setErrors((prev) => [...prev, msg]);
      toast.error(msg);
      return null;
    }
    if (file.size === 0 || file.size > MAX_BYTES) {
      const msg = `${file.name}: must be between 1 byte and 15 MB`;
      setErrors((prev) => [...prev, msg]);
      toast.error(msg);
      return null;
    }

    setUploadingCount((c) => c + 1);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("Could not read file"));
        };
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsDataURL(file);
      });

      const data = await uploadMutation.mutateAsync({
        base64,
        mimeType: file.type,
        originalFilename: file.name,
        entityType,
      });

      return {
        filePath: data.key,
        originalFilename: file.name,
        mimeType: data.mimeType,
        fileSize: data.sizeBytes,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setErrors((prev) => [...prev, `${file.name}: ${msg}`]);
      toast.error(`Upload failed: ${msg}`);
      return null;
    } finally {
      setUploadingCount((c) => c - 1);
    }
  }

  async function handleFileList(fileList: FileList | null) {
    if (!fileList) return;
    setErrors([]);
    const files = Array.from(fileList);

    // Snapshot current value so parallel uploads all append to the same base
    const snapshot = value;
    const results = await Promise.all(
      files.map((file) => handleFile(file, snapshot)),
    );
    const succeeded = results.filter(
      (r): r is UploadedAttachment => r !== null,
    );
    if (succeeded.length > 0) {
      onChange([...snapshot, ...succeeded]);
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function removeItem(filePath: string) {
    onChange(value.filter((a) => a.filePath !== filePath));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_ATTR}
        multiple
        className="hidden"
        disabled={isDisabled}
        onChange={(e) => void handleFileList(e.target.files)}
      />

      {/* Dropzone / trigger button */}
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-md border border-dashed px-6 py-8 text-center transition-colors",
          isDisabled
            ? "cursor-not-allowed opacity-50 border-muted-foreground/25"
            : "cursor-pointer border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Uploading {uploadingCount} file
              {uploadingCount !== 1 ? "s" : ""}…
            </p>
          </>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Click to upload attachments
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPEG · PNG · WEBP · PDF · max 15 MB each
            </p>
          </>
        )}
      </button>

      {/* Per-file errors */}
      {errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((e, i) => (
            <li key={i} className="text-sm text-destructive">
              {e}
            </li>
          ))}
        </ul>
      )}

      {/* Uploaded attachment list */}
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((attachment) => {
            const isPdf = attachment.mimeType === "application/pdf";
            return (
              <li
                key={attachment.filePath}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                {isPdf ? (
                  <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 truncate">
                  {attachment.originalFilename}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatBytes(attachment.fileSize)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isDisabled}
                  onClick={() => removeItem(attachment.filePath)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">
                    Remove {attachment.originalFilename}
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
