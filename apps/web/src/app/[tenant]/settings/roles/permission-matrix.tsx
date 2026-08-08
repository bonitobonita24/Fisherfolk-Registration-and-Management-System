"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FEATURE_LABELS, FEATURE_ROWS, MATRIX_ACTION_LABELS } from "./feature-labels";
import {
  MATRIX_ACTIONS,
  setColumn,
  setRow,
  toggleCell,
  type PermissionGrid,
} from "./matrix-transform";

interface PermissionMatrixProps {
  grid: PermissionGrid;
  onChange: (next: PermissionGrid) => void;
  disabled?: boolean;
}

/**
 * The accessible permission matrix — a real semantic `<table>` with
 * `scope="row"`/`scope="col"` headers and a labeled checkbox per cell
 * (WCAG 2.2 AA: 1.3.1 Info and Relationships, 4.1.2 Name/Role/Value).
 * Every checkbox carries an explicit `aria-label` ("Fisherfolk — Create")
 * so it has an accessible name independent of the visual table layout, and
 * row/column "select all" affordances are themselves real, keyboard-operable
 * `<button>`s (never color/shape-only signals).
 */
export function PermissionMatrix({ grid, onChange, disabled = false }: PermissionMatrixProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableCaption className="sr-only">
          Permission matrix — one row per feature, one column per action. Check
          a box to grant that action on that feature to this custom role.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-40">
              Feature
            </TableHead>
            {MATRIX_ACTIONS.map((action) => (
              <TableHead key={action} scope="col" className="text-center align-bottom">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {MATRIX_ACTION_LABELS[action]}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs font-normal text-muted-foreground"
                    disabled={disabled}
                    onClick={() => onChange(setColumn(grid, action, true))}
                    aria-label={`Grant ${MATRIX_ACTION_LABELS[action]} on every feature`}
                  >
                    All
                  </Button>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURE_ROWS.map((featureKey) => (
            <TableRow key={featureKey}>
              <TableHead scope="row" className="text-left text-sm font-medium">
                <div className="flex items-center justify-between gap-2">
                  <span>{FEATURE_LABELS[featureKey]}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs font-normal text-muted-foreground"
                    disabled={disabled}
                    onClick={() => onChange(setRow(grid, featureKey, true))}
                    aria-label={`Grant every action on ${FEATURE_LABELS[featureKey]}`}
                  >
                    All
                  </Button>
                </div>
              </TableHead>
              {MATRIX_ACTIONS.map((action) => (
                <TableCell key={action} className="text-center">
                  <Checkbox
                    checked={grid[featureKey][action]}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onChange(toggleCell(grid, featureKey, action, checked === true))
                    }
                    aria-label={`${FEATURE_LABELS[featureKey]} — ${MATRIX_ACTION_LABELS[action]}`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
