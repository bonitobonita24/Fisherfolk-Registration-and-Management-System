"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateEditor } from "./template-editor";
import { SelectAndPrint, type PrintSelection } from "./select-and-print";
import { PvcSheet } from "./pvc-sheet";

interface IdGeneratorClientProps {
  canManage: boolean;
}

export function IdGeneratorClient({ canManage }: IdGeneratorClientProps) {
  const [printSelection, setPrintSelection] = useState<PrintSelection | null>(null);

  // Encoders only see Select & Print; admins/super_admins see all tabs.
  const defaultTab = canManage ? "editor" : "select";

  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList aria-label="ID Generator sections">
        {canManage && (
          <TabsTrigger value="editor">Template Editor</TabsTrigger>
        )}
        <TabsTrigger value="select">Select &amp; Print</TabsTrigger>
      </TabsList>

      {/* forceMount keeps both tabs mounted so selection state survives tab switches */}
      {canManage && (
        <TabsContent value="editor" className="mt-0 data-[state=inactive]:hidden" forceMount>
          <TemplateEditor canManage={canManage} />
        </TabsContent>
      )}

      <TabsContent value="select" className="mt-0 data-[state=inactive]:hidden" forceMount>
        {printSelection !== null ? (
          <PvcSheet
            selection={printSelection}
            onBack={() => setPrintSelection(null)}
          />
        ) : (
          <SelectAndPrint onProceedToLayout={setPrintSelection} />
        )}
      </TabsContent>
    </Tabs>
  );
}
