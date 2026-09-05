"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RecordHeader,
  DetailField,
  DefinitionGrid,
  LocationPicker,
  ConfirmDialog,
} from "@/components/shared";
import { NoteEditor } from "@/components/notes/note-editor";
import { NoteComposeClient } from "../new/note-compose-client";

interface Props {
  id: string;
  currentUserId: string | null;
  isAdmin: boolean;
}

function formatDateTime(value: Date | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NoteDetailClient({ id, currentUserId, isAdmin }: Props) {
  const router = useRouter();
  const tenantHref = useTenantHref();
  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();
  const { data: note, isLoading, isError, error } = trpc.note.getById.useQuery({ id });

  const deleteMutation = trpc.note.delete.useMutation({
    onSuccess: () => {
      toast.success("Field note deleted.");
      void utils.note.list.invalidate();
      router.push(tenantHref("/notes"));
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading field note…</p>;
  }

  if (isError || !note) {
    const notFound = error?.data?.code === "NOT_FOUND";
    return (
      <div className="space-y-4 pb-4">
        <RecordHeader backHref={tenantHref("/notes")} backLabel="Back to Field Diary" title="Field note" />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {notFound ? "Field note not found." : "Failed to load field note."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canManage = isAdmin || note.authorId === currentUserId;
  const label = note.title?.trim() || "Field note";

  if (isEditing) {
    return (
      <div className="space-y-4 pb-4">
        <RecordHeader
          backHref={tenantHref(`/notes/${id}`)}
          backLabel="Cancel edit"
          title={`Editing: ${label}`}
        />
        <NoteComposeClient
          initial={{
            id: note.id,
            title: note.title,
            body: note.body as Record<string, unknown>,
            capturedAt: note.capturedAt,
            latitude: note.latitude,
            longitude: note.longitude,
            locationLabel: note.locationLabel,
            media: note.media.map((m) => ({
              storageKey: m.storageKey,
              originalFilename: m.originalFilename,
              mimeType: m.mimeType,
              fileSize: m.fileSize,
              ...(m.blockId != null ? { blockId: m.blockId } : {}),
            })),
          }}
          onSaved={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <RecordHeader
        backHref={tenantHref("/notes")}
        backLabel="Back to Field Diary"
        title={label}
        meta={`${formatDateTime(note.capturedAt)} · ${note.locationLabel}`}
        actions={
          canManage ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-1.5 size-3.5" />
                Edit
              </Button>
              <ConfirmDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-1.5 size-3.5" />
                    Delete
                  </Button>
                }
                title="Delete this field note?"
                description="This permanently deletes the note and its attached photos. This cannot be undone."
                confirmLabel="Delete"
                onConfirm={() => deleteMutation.mutate({ id })}
              />
            </>
          ) : undefined
        }
      />

      <Card className="gap-0 py-5">
        <CardHeader className="px-6 pb-4 pt-0">
          <CardTitle className="text-sm font-medium">Note</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-0">
          <NoteEditor
            editable={false}
            initialContent={note.body as Record<string, unknown>}
            ariaLabel="Field note content (read-only)"
          />
        </CardContent>
      </Card>

      <Card className="gap-0 py-5">
        <CardHeader className="px-6 pb-4 pt-0">
          <CardTitle className="text-sm font-medium">Field-capture details</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-0">
          <DefinitionGrid columns={3}>
            <DetailField label="Author" value={note.author?.name} />
            <DetailField label="Captured At" value={formatDateTime(note.capturedAt)} />
            <DetailField label="Location Label" value={note.locationLabel} />
            <DetailField
              label="Visibility"
              value={note.visibility === "shared" ? "Shared" : "Private"}
            />
          </DefinitionGrid>
        </CardContent>
      </Card>

      <Card className="gap-0 py-5">
        <CardHeader className="px-6 pb-4 pt-0">
          <CardTitle className="text-sm font-medium">Location</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-0">
          <LocationPicker
            disabled
            value={{ lat: note.latitude, lng: note.longitude }}
            onChange={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  );
}
