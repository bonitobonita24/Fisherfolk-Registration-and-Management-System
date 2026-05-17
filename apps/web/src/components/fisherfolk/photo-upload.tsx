"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 2 * 1024 * 1024;

interface PhotoUploadProps {
  value: string | undefined;
  onChange: (key: string | undefined) => void;
  className?: string;
  disabled?: boolean;
}

export function PhotoUpload({
  value,
  onChange,
  className,
  disabled,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const uploadMutation = trpc.upload.uploadFile.useMutation({
    onSuccess: (data) => {
      onChange(data.key);
      setPreviewUrl(data.downloadUrl);
      setLocalError(null);
    },
    onError: (error) => {
      setLocalError(error.message);
      toast.error(`Photo upload failed: ${error.message}`);
    },
  });

  const downloadQuery = trpc.upload.getDownloadUrl.useQuery(
    { key: value ?? "" },
    {
      enabled: Boolean(value) && previewUrl == null,
      staleTime: 30 * 60 * 1000,
    },
  );

  useEffect(() => {
    if (downloadQuery.data?.url && previewUrl == null) {
      setPreviewUrl(downloadQuery.data.url);
    }
  }, [downloadQuery.data, previewUrl]);

  useEffect(() => {
    if (!value) setPreviewUrl(null);
  }, [value]);

  function handleFile(file: File) {
    setLocalError(null);

    if (!ACCEPTED.split(",").includes(file.type)) {
      setLocalError("Only JPEG, PNG, or WEBP allowed.");
      return;
    }
    if (file.size === 0 || file.size > MAX_BYTES) {
      setLocalError("File must be 1 byte to 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        setLocalError("Could not read file.");
        return;
      }
      uploadMutation.mutate({
        base64: result,
        mimeType: file.type,
        originalFilename: file.name,
        entityType: "fisherfolk-photo",
      });
    };
    reader.onerror = () => setLocalError("Could not read file.");
    reader.readAsDataURL(file);
  }

  function handleClear() {
    onChange(undefined);
    setPreviewUrl(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const isUploading = uploadMutation.isPending;
  const hasPhoto = Boolean(value);
  const isDisabled = (disabled ?? false) || isUploading;

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        disabled={isDisabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {hasPhoto && previewUrl ? (
        <div className="flex items-start gap-4">
          <div className="relative h-40 w-32 overflow-hidden rounded-md border border-border bg-muted">
            <Image
              src={previewUrl}
              alt="Fisherfolk photo preview"
              fill
              sizes="128px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Photo uploaded.</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDisabled}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                onClick={handleClear}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-40 w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/20 px-6 text-center transition-colors hover:border-muted-foreground/50",
            isDisabled && "cursor-not-allowed opacity-50",
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="mb-2 h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading…</p>
            </>
          ) : (
            <>
              <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload photo
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                JPEG / PNG / WEBP · max 2MB
              </p>
            </>
          )}
        </button>
      )}

      {localError && (
        <p className="text-sm text-destructive">{localError}</p>
      )}
    </div>
  );
}
