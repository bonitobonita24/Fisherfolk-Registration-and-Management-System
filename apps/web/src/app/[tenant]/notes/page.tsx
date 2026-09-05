import Link from "next/link";
import { Plus } from "lucide-react";

import { tenantHref } from "@/lib/tenant-href.server";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { NotesListClient } from "./notes-list-client";

interface NotesPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function NotesPage({ params }: NotesPageProps) {
  const { tenant } = await params;
  const newNoteHref = await tenantHref(tenant, "/notes/new");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Diary"
        description="Field notes captured with a location and timestamp stamp — private by default, shareable with the team."
        action={
          <Button asChild>
            <Link href={newNoteHref}>
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Link>
          </Button>
        }
      />
      <NotesListClient />
    </div>
  );
}
