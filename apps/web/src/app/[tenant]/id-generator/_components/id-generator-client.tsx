"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateEditor } from "./template-editor";
import { SelectAndPrint, type PrintSelection } from "./select-and-print";

interface IdGeneratorClientProps {
  canManage: boolean;
}

export function IdGeneratorClient({ canManage }: IdGeneratorClientProps) {
  const [printSelection, setPrintSelection] = useState<PrintSelection | null>(null);

  return (
    <Tabs defaultValue="editor" className="space-y-6">
      <TabsList>
        <TabsTrigger value="editor">Template Editor</TabsTrigger>
        <TabsTrigger value="select">Select &amp; Print</TabsTrigger>
      </TabsList>

      {/* forceMount keeps both tabs mounted so selection state survives tab switches */}
      <TabsContent value="editor" className="mt-0 data-[state=inactive]:hidden" forceMount>
        <TemplateEditor canManage={canManage} />
      </TabsContent>

      <TabsContent value="select" className="mt-0 data-[state=inactive]:hidden" forceMount>
        {printSelection !== null ? (
          <div className="rounded-lg border bg-muted/40 px-6 py-10 text-center">
            <p className="text-sm font-semibold">
              Layout queued: {printSelection.subjects.length} subject
              {printSelection.subjects.length !== 1 ? "s" : ""} · template &ldquo;
              {printSelection.templateName}&rdquo;
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PVC sheet layout (S6) will render here.
            </p>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="mt-4 h-auto p-0 text-xs"
              onClick={() => setPrintSelection(null)}
            >
              ← Back to selection
            </Button>
          </div>
        ) : (
          <SelectAndPrint onProceedToLayout={setPrintSelection} />
        )}
      </TabsContent>
    </Tabs>
  );
}
