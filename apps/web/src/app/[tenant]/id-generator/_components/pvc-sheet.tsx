"use client";

import { useCallback, useState } from "react";
import { ID_CARD_GEOMETRY, idElementSchema, type IdElement } from "@frms/shared/schemas";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IdCardRenderer, type CardData } from "./id-card-renderer";
import { type PrintSelection, type PrintSubject } from "./select-and-print";

// 1 CSS mm = 96/25.4 CSS px at standard 96 DPI.
// IdCardRenderer at this scale fills an mm-sized container exactly.
const PRINT_SCALE = 96 / 25.4; // ≈3.7795 px/mm

const {
  maxPairsPerSheet,
  bleedWidthMm,
  bleedHeightMm,
  contentWidthMm,
  contentHeightMm,
  bleedMarginMm,
  sheetWidthMm,
  sheetHeightMm,
} = ID_CARD_GEOMETRY;

// Row gap between pairs (mm). With 4 rows × 56mm + 3 gaps in 300mm:
// padding = (300 - 4×56 - 3×gap) / 2
const ROW_GAP_MM = 8;
const SHEET_PAD_V_MM =
  (sheetHeightMm - maxPairsPerSheet * bleedHeightMm - (maxPairsPerSheet - 1) * ROW_GAP_MM) / 2;
// Horizontal padding: center 2×88mm cards in 200mm
const SHEET_PAD_H_MM = (sheetWidthMm - 2 * bleedWidthMm) / 2;

interface PvcSheetProps {
  selection: PrintSelection;
  onBack: () => void;
}

export function PvcSheet({ selection, onBack }: PvcSheetProps) {
  const [printing, setPrinting] = useState(false);

  const templateQuery = trpc.idTemplate.getById.useQuery(
    { id: selection.templateId },
    { staleTime: Infinity },
  );

  const subjectDataQuery = trpc.idPrint.getSubjectPrintData.useQuery(
    {
      subjectIds: selection.subjects.map((s) => s.subjectId),
      templateType: selection.templateType,
    },
    { staleTime: Infinity, enabled: selection.subjects.length > 0 },
  );

  const recordPrint = trpc.idPrint.recordPrint.useMutation();

  const handlePrint = useCallback(async () => {
    const count = selection.subjects.length;
    if (
      !window.confirm(
        `Print ${count} ID${count !== 1 ? "s" : ""}? This will record a print batch.`,
      )
    )
      return;

    setPrinting(true);
    try {
      const result = await recordPrint.mutateAsync({
        templateId: selection.templateId,
        templateType: selection.templateType,
        subjects: selection.subjects.map((s) => ({
          subjectId: s.subjectId,
          subjectType: s.subjectType,
          registrationType: s.registrationType,
        })),
      });
      toast.success(
        `Print recorded — ${result.idCount} ID${result.idCount !== 1 ? "s" : ""}.`,
      );
      window.print();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to record print batch.",
      );
    } finally {
      setPrinting(false);
    }
  }, [selection, recordPrint]);

  // Parse elements from Prisma JSON using schema validation
  const template = templateQuery.data;
  const parseElements = (raw: unknown): IdElement[] =>
    idElementSchema.array().safeParse(raw).data ?? [];
  const frontElements = template ? parseElements(template.frontElements) : [];
  const backElements = template ? parseElements(template.backElements) : [];

  // Build subjectId → CardData lookup
  const dataMap = new Map<string, CardData>(
    (subjectDataQuery.data ?? []).map(({ subjectId, data }) => [
      subjectId,
      data,
    ]),
  );

  // Fixed 4 slots — fill from selection, pad remaining with null
  const slots: Array<PrintSubject | null> = Array.from(
    { length: maxPairsPerSheet },
    (_, i) => selection.subjects[i] ?? null,
  );

  const isLoading = templateQuery.isLoading || subjectDataQuery.isLoading;
  const hasError = templateQuery.isError || subjectDataQuery.isError;
  const canPrint = !isLoading && !hasError && !printing;

  return (
    <>
      {/* Print CSS: isolate PVC sheet on its own 200×300mm page */}
      <style>{`
        @media print {
          @page { size: ${sheetWidthMm}mm ${sheetHeightMm}mm; margin: 0; }
          body * { visibility: hidden; }
          #pvc-sheet-root, #pvc-sheet-root * { visibility: visible; }
          #pvc-sheet-root {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          [data-print-hide] { display: none !important; }
        }
      `}</style>

      {/* Screen-only controls — hidden on print via data-print-hide */}
      <div
        data-print-hide
        className="mb-4 flex items-center justify-between gap-3"
      >
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={onBack}
        >
          ← Back to selection
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {selection.subjects.length}/{maxPairsPerSheet} IDs ·{" "}
            {selection.templateName}
          </span>
          <Button
            type="button"
            size="sm"
            onClick={() => { void handlePrint(); }}
            disabled={!canPrint}
            aria-label="Print ID cards and record print batch"
          >
            {printing ? "Recording…" : "Print"}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div
          data-print-hide
          className="flex items-center justify-center py-10 text-sm text-muted-foreground"
        >
          Loading template data…
        </div>
      )}

      {hasError && (
        <div
          data-print-hide
          className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          Failed to load template or subject data. Go back and try again.
        </div>
      )}

      {/* PVC sheet — 200×300mm, rendered as a screen preview and verbatim in print */}
      {!isLoading && !hasError && (
        <div
          id="pvc-sheet-root"
          role="region"
          aria-label={`PVC sheet — ${selection.subjects.length} ID${selection.subjects.length !== 1 ? "s" : ""}, template "${selection.templateName}"`}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${ROW_GAP_MM}mm`,
            width: `${sheetWidthMm}mm`,
            height: `${sheetHeightMm}mm`,
            padding: `${SHEET_PAD_V_MM}mm ${SHEET_PAD_H_MM}mm`,
            boxSizing: "border-box",
            background: "white",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
            border: "1px solid #e5e7eb",
          }}
        >
          {slots.map((subject, idx) => (
            <PairRow
              key={idx}
              slotIndex={idx}
              subject={subject}
              frontElements={frontElements}
              backElements={backElements}
              frontBg={template?.frontBackgroundUrl ?? null}
              backBg={template?.backBackgroundUrl ?? null}
              data={subject ? (dataMap.get(subject.subjectId) ?? {}) : {}}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ─── PairRow — one FRONT + one BACK (mirrored) card side by side ─────────────

interface PairRowProps {
  slotIndex: number;
  subject: PrintSubject | null;
  frontElements: IdElement[];
  backElements: IdElement[];
  frontBg: string | null;
  backBg: string | null;
  data: CardData;
}

function PairRow({
  slotIndex,
  subject,
  frontElements,
  backElements,
  frontBg,
  backBg,
  data,
}: PairRowProps) {
  return (
    <div
      style={{ display: "flex", flexDirection: "row", flexShrink: 0 }}
      aria-label={
        subject
          ? `Pair ${slotIndex + 1}: ${subject.name}`
          : `Pair ${slotIndex + 1}: empty`
      }
    >
      <CardFace
        subject={subject}
        elements={frontElements}
        backgroundUrl={frontBg}
        data={data}
        face="front"
        mirrored={false}
      />
      {/* Back face: scaleX(-1) mirrors content for film back-printing */}
      <CardFace
        subject={subject}
        elements={backElements}
        backgroundUrl={backBg}
        data={data}
        face="back"
        mirrored={true}
      />
    </div>
  );
}

// ─── CardFace — single card face (front or mirrored back) ─────────────────────

interface CardFaceProps {
  subject: PrintSubject | null;
  elements: IdElement[];
  backgroundUrl: string | null;
  data: CardData;
  face: "front" | "back";
  mirrored: boolean;
}

function CardFace({
  subject,
  elements,
  backgroundUrl,
  data,
  face,
  mirrored,
}: CardFaceProps) {
  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: `${bleedWidthMm}mm`,
    height: `${bleedHeightMm}mm`,
    overflow: "hidden",
    flexShrink: 0,
    ...(mirrored
      ? { transform: "scaleX(-1)", transformOrigin: "center center" }
      : {}),
  };

  if (!subject) {
    return (
      <div
        aria-hidden="true"
        style={{
          ...containerStyle,
          border: "1.5px dashed #d1d5db",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
        }}
      >
        <span
          style={{
            color: "#9ca3af",
            fontSize: "7pt",
            fontFamily: "sans-serif",
          }}
        >
          {face} — empty
        </span>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <IdCardRenderer
        elements={elements}
        backgroundUrl={backgroundUrl}
        data={data}
        mode="print"
        scale={PRINT_SCALE}
      />
      {/* Cut guide: 86×54mm cut line at 1mm inset from the 88×56mm bleed boundary */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: `${bleedMarginMm}mm`,
          top: `${bleedMarginMm}mm`,
          width: `${contentWidthMm}mm`,
          height: `${contentHeightMm}mm`,
          border: "0.3mm dashed rgba(80,80,80,0.35)",
          pointerEvents: "none",
          zIndex: 20,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
