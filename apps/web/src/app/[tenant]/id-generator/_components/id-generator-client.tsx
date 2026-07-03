"use client";

import { useState } from "react";
import { SelectAndPrint, type PrintSelection } from "./select-and-print";
import { PvcSheet } from "./pvc-sheet";

/**
 * Encoder print flow — two steps:
 *  1. Select fisherfolk to print (1–4, recent quick-select + search)
 *  2. Confirm & print (exact print preview with the active template)
 *
 * Template design lives in Settings → ID Card Template (admin only).
 */
export function IdGeneratorClient() {
  const [printSelection, setPrintSelection] = useState<PrintSelection | null>(
    null,
  );

  const step = printSelection === null ? 1 : 2;

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <ol
        className="flex items-center gap-2 text-sm"
        aria-label="Print flow progress"
      >
        <li
          aria-current={step === 1 ? "step" : undefined}
          className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
            step === 1
              ? "border-primary bg-primary/10 font-medium"
              : "text-muted-foreground"
          }`}
        >
          <span
            aria-hidden="true"
            className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
              step === 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            1
          </span>
          Select fisherfolk
        </li>
        <li aria-hidden="true" className="text-muted-foreground">
          →
        </li>
        <li
          aria-current={step === 2 ? "step" : undefined}
          className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
            step === 2
              ? "border-primary bg-primary/10 font-medium"
              : "text-muted-foreground"
          }`}
        >
          <span
            aria-hidden="true"
            className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
              step === 2
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </span>
          Confirm &amp; print
        </li>
      </ol>

      {printSelection !== null ? (
        <PvcSheet
          selection={printSelection}
          onBack={() => setPrintSelection(null)}
        />
      ) : (
        <SelectAndPrint onProceedToLayout={setPrintSelection} />
      )}
    </div>
  );
}
