"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import SignatureCanvas from "react-signature-canvas";
import { Eraser, Loader2, PenTool, Save, X } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  value: string | undefined;
  onChange: (key: string | undefined) => void;
  className?: string;
  disabled?: boolean;
}

export function SignaturePad({
  value,
  onChange,
  className,
  disabled,
}: SignaturePadProps) {
  const canvasRef = useRef<SignatureCanvas | null>(null);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const uploadMutation = trpc.upload.uploadFile.useMutation({
    onSuccess: (data) => {
      onChange(data.key);
      setPreviewUrl(data.downloadUrl);
      setHasStrokes(false);
      setLocalError(null);
      toast.success("Signature saved.");
    },
    onError: (error) => {
      setLocalError(error.message);
      toast.error(`Signature upload failed: ${error.message}`);
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

  function handleClear() {
    canvasRef.current?.clear();
    setHasStrokes(false);
    setLocalError(null);
  }

  function handleSave() {
    setLocalError(null);
    const canvas = canvasRef.current;
    if (!canvas || canvas.isEmpty()) {
      setLocalError("Please draw your signature first.");
      return;
    }
    const dataUrl = canvas.getTrimmedCanvas().toDataURL("image/png");
    uploadMutation.mutate({
      base64: dataUrl,
      mimeType: "image/png",
      originalFilename: `signature-${Date.now()}.png`,
      entityType: "fisherfolk-signature",
    });
  }

  function handleRemove() {
    onChange(undefined);
    setPreviewUrl(null);
    setHasStrokes(false);
    setLocalError(null);
  }

  const isUploading = uploadMutation.isPending;
  const isDisabled = (disabled ?? false) || isUploading;
  const hasSavedSignature = Boolean(value);

  if (hasSavedSignature && previewUrl) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-start gap-4">
          <div className="relative h-32 w-64 overflow-hidden rounded-md border border-border bg-white">
            <Image
              src={previewUrl}
              alt="Signature preview"
              fill
              sizes="256px"
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Signature saved.</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDisabled}
              onClick={handleRemove}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Remove and re-sign
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-hidden rounded-md border border-border bg-white">
        {/* react-signature-canvas v1.1.0-alpha.2 ships React-18 class typings
            that fight React 19's stricter Component constraints under
            exactOptionalPropertyTypes. Runtime is fine; only the JSX element
            type-check is impacted. */}
        {/* @ts-expect-error class typings vs React 19 */}
        <SignatureCanvas
          ref={(instance: SignatureCanvas | null) => {
            canvasRef.current = instance;
          }}
          penColor="#0f172a"
          backgroundColor="rgba(255,255,255,1)"
          onBegin={() => setHasStrokes(true)}
          canvasProps={{
            className: "h-40 w-full touch-none",
            "aria-label": "Signature pad",
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDisabled || !hasStrokes}
          onClick={handleClear}
        >
          <Eraser className="mr-1.5 h-3.5 w-3.5" />
          Clear
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isDisabled || !hasStrokes}
          onClick={handleSave}
        >
          {isUploading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-3.5 w-3.5" />
          )}
          Save signature
        </Button>
        <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <PenTool className="h-3 w-3" />
          Sign with mouse, finger, or stylus.
        </span>
      </div>

      {localError && (
        <p className="text-sm text-destructive">{localError}</p>
      )}
    </div>
  );
}
