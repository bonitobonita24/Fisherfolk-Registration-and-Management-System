"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormSection,
  FormActions,
  LocationPicker,
  type LocationPickerValue,
} from "@/components/shared";
import {
  NoteEditor,
  type NoteEditorHandle,
  type NoteMediaDraft,
} from "@/components/notes/note-editor";

const BACK_DATE_WINDOW_DAYS = 14;

/** Format a Date to the `datetime-local` input value (local time, no seconds). */
function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export interface NoteComposeInitial {
  id: string;
  title: string | null;
  body: Record<string, unknown>;
  capturedAt: string | Date;
  latitude: number;
  longitude: number;
  locationLabel: string;
  media: NoteMediaDraft[];
}

interface NoteComposeClientProps {
  /** Present in edit mode — prefills every field and switches Save to note.update. */
  initial?: NoteComposeInitial;
  onSaved?: (noteId: string) => void;
  onCancel?: () => void;
}

/**
 * FIS-36 field-note compose screen — shared between "New note" (Phase 1
 * primary flow) and the detail page's in-place "Edit" mode. Location +
 * captured-at are the mandatory field-capture stamp (note.create/update
 * schema); Save stays disabled until a location has been set.
 */
export function NoteComposeClient({
  initial,
  onSaved,
  onCancel,
}: NoteComposeClientProps) {
  const router = useRouter();
  const tenantHref = useTenantHref();
  const editorRef = useRef<NoteEditorHandle>(null);
  const isEdit = initial !== undefined;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [location, setLocation] = useState<LocationPickerValue | null>(
    initial ? { lat: initial.latitude, lng: initial.longitude } : null,
  );
  const [locationLabel, setLocationLabel] = useState(
    initial?.locationLabel ?? "",
  );
  const [capturedAt, setCapturedAt] = useState(() =>
    toDatetimeLocal(initial ? new Date(initial.capturedAt) : new Date()),
  );

  const now = useMemo(() => new Date(), []);
  const minCapturedAt = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - BACK_DATE_WINDOW_DAYS);
    return toDatetimeLocal(d);
  }, [now]);
  const maxCapturedAt = useMemo(() => toDatetimeLocal(now), [now]);

  // Pre-seed from the browser's geolocation on a fresh (create) note when
  // permission is already granted — silent, no error toast on decline;
  // the LocationPicker's own "Use my location" button covers the explicit ask.
  useEffect(() => {
    if (isEdit || location !== null) return;
    if (typeof window === "undefined" || !window.isSecureContext) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Silent — user can still place the pin manually or use the button.
      },
      { enableHighAccuracy: true, timeout: 8_000 },
    );
    // Runs once on mount for a new note; isEdit/location are read only to
    // gate against re-arming, not to drive re-runs.
  }, []);

  const utils = trpc.useUtils();

  const createMutation = trpc.note.create.useMutation({
    onSuccess: (note) => {
      toast.success("Field note saved.");
      void utils.note.list.invalidate();
      if (onSaved) {
        onSaved(note.id);
      } else {
        router.push(tenantHref(`/notes/${note.id}`));
      }
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.note.update.useMutation({
    onSuccess: (note) => {
      toast.success("Field note updated.");
      void utils.note.list.invalidate();
      void utils.note.getById.invalidate({ id: note.id });
      if (onSaved) onSaved(note.id);
    },
    onError: (error) => toast.error(error.message),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const canSave = location !== null && locationLabel.trim().length > 0;

  function handleSave() {
    if (!editorRef.current || location === null) return;
    const body = editorRef.current.getJSON();
    const bodyText = editorRef.current.getText().trim();
    const media = editorRef.current.getMedia();

    if (bodyText.length === 0) {
      toast.error("Write something before saving.");
      return;
    }
    if (locationLabel.trim().length === 0) {
      toast.error("Add a short location label.");
      return;
    }

    const capturedAtDate = new Date(capturedAt);

    if (isEdit) {
      updateMutation.mutate({
        id: initial.id,
        title: title.trim() || null,
        body,
        bodyText,
        latitude: location.lat,
        longitude: location.lng,
        locationLabel: locationLabel.trim(),
        capturedAt: capturedAtDate,
        media,
      });
    } else {
      createMutation.mutate({
        title: title.trim() || undefined,
        body,
        bodyText,
        latitude: location.lat,
        longitude: location.lng,
        locationLabel: locationLabel.trim(),
        capturedAt: capturedAtDate,
        media,
        entityRefs: [],
      });
    }
  }

  return (
    <div className="space-y-6">
      <FormSection title="Note">
        <div className="space-y-2">
          <Label htmlFor="note-title">Title (optional)</Label>
          <Input
            id="note-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Verde Island Passage patrol"
            maxLength={255}
          />
        </div>
        <div className="space-y-2">
          <Label>Note content</Label>
          <NoteEditor
            ref={editorRef}
            editable
            initialContent={initial?.body ?? null}
            initialMedia={initial?.media}
            ariaLabel="Field note content"
          />
        </div>
      </FormSection>

      <FormSection
        title="Field-capture stamp"
        description="Every note requires a location and the date/time it was captured. Back-dating is allowed up to 14 days."
      >
        <div className="space-y-2">
          <Label>Location *</Label>
          <LocationPicker value={location} onChange={setLocation} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="note-location-label">Location label *</Label>
            <Input
              id="note-location-label"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="e.g. Brgy. Salong shoreline"
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-captured-at">Captured at *</Label>
            <Input
              id="note-captured-at"
              type="datetime-local"
              value={capturedAt}
              min={minCapturedAt}
              max={maxCapturedAt}
              onChange={(e) => setCapturedAt(e.target.value)}
            />
          </div>
        </div>
      </FormSection>

      <FormActions>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button type="button" variant="outline" asChild>
            <Link href={tenantHref(isEdit ? `/notes/${initial.id}` : "/notes")}>
              Cancel
            </Link>
          </Button>
        )}
        <Button
          type="button"
          disabled={!canSave || isSubmitting}
          onClick={handleSave}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Save Note"}
        </Button>
      </FormActions>
    </div>
  );
}
