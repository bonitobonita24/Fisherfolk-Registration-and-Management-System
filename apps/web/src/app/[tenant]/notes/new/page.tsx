import { PageHeader } from "@/components/shared";
import { NoteComposeClient } from "./note-compose-client";

export default function NewNotePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Field Note"
        description="Capture a field observation. A location and time stamp are required — this records where and when the note was taken."
      />
      <NoteComposeClient />
    </div>
  );
}
