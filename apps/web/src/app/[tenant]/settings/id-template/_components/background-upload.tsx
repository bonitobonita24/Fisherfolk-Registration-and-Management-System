"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

interface BackgroundUploadProps {
  side: "front" | "back";
  currentUrl: string | null;
  onUrlChange: (url: string | null) => void;
}

export function BackgroundUpload({
  side,
  currentUrl,
  onUrlChange,
}: BackgroundUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = trpc.upload.uploadFile.useMutation({
    onError: (err) => {
      // setUploading(false) is handled by the finally block in handleFileChange
      console.error("Background upload failed:", err.message);
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadMutation.mutateAsync({
        base64,
        mimeType: file.type,
        originalFilename: file.name,
        entityType: "id-template-bg",
      });
      onUrlChange(result.downloadUrl);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {side === "front" ? "Front" : "Back"} background
      </p>

      {currentUrl ? (
        <div className="relative rounded border overflow-hidden" style={{ height: 64 }}>
          <Image
            src={currentUrl}
            alt={`${side} background`}
            fill
            sizes="200px"
            style={{ objectFit: "cover" }}
            unoptimized
          />
          <button
            type="button"
            aria-label="Remove background"
            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
            onClick={() => onUrlChange(null)}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="rounded border border-dashed bg-muted/30 h-16 flex items-center justify-center">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={`Upload ${side} background image`}
        onChange={(e) => { void handleFileChange(e); }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full h-7 text-xs"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            Uploading…
          </>
        ) : (
          "Upload Image"
        )}
      </Button>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
