/**
 * Pure helpers for the ToDo feature: source-entity link resolution and
 * date / month-grid math. No React, no external dependencies.
 */

export type SourceEntityType =
  | "fisherfolk"
  | "vessel"
  | "violation"
  | "ayudaProgram";

/**
 * WCAG 2.2 AA-safe treatment for "urgent" / "overdue" indicators on the ToDo
 * surfaces. The default shadcn `destructive` variant (white text on
 * `--destructive`) measures ~2.73:1 here, below the 4.5:1 text-contrast
 * requirement. This fixed dark-red background + white text passes in both
 * light and dark mode without touching the global `--destructive` token.
 */
export const URGENT_DESTRUCTIVE_CLASS =
  "border-transparent bg-red-700 text-white hover:bg-red-700/90 dark:bg-red-700 dark:text-white dark:hover:bg-red-700/90";

export const SOURCE_ENTITY_LABELS: Record<SourceEntityType, string> = {
  fisherfolk: "Fisherfolk",
  vessel: "Vessel",
  violation: "Violation",
  ayudaProgram: "Ayuda",
};

const SOURCE_ENTITY_ROUTES: Record<SourceEntityType, string> = {
  fisherfolk: "fisherfolk",
  vessel: "vessels",
  violation: "violations",
  ayudaProgram: "ayuda",
};

function isSourceEntityType(value: string): value is SourceEntityType {
  return (
    value === "fisherfolk" ||
    value === "vessel" ||
    value === "violation" ||
    value === "ayudaProgram"
  );
}

export function sourceEntityLink(
  type: string | null | undefined,
  id: string | null | undefined,
  tenant: string,
): { href: string; label: string } | null {
  if (type === null || type === undefined || type === "") {
    return null;
  }
  if (id === null || id === undefined || id === "") {
    return null;
  }
  if (!isSourceEntityType(type)) {
    return null;
  }

  const segment = SOURCE_ENTITY_ROUTES[type];
  return {
    href: `/${tenant}/${segment}/${id}`,
    label: SOURCE_ENTITY_LABELS[type],
  };
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfToday(): Date {
  return startOfDay(new Date());
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isOverdue(
  dueDate: Date | string | null | undefined,
  status: string,
): boolean {
  if (dueDate === null || dueDate === undefined || dueDate === "") {
    return false;
  }
  if (status === "DONE") {
    return false;
  }

  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return due < startOfToday();
}

export function formatDueDate(dueDate: Date | string): string {
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Builds a Sunday-first month grid for the given year/month (0-indexed).
 * Returns an array of week-rows, each with 7 cells. Cells outside the
 * target month are `null`; in-month cells are Dates at 00:00 local.
 */
export function monthMatrix(year: number, month: number): (Date | null)[][] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - leadingBlanks + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push(null);
    } else {
      cells.push(new Date(year, month, dayNumber));
    }
  }

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

/**
 * Adds `delta` months to the given year/month (0-indexed), rolling the
 * year over as needed. Handles arbitrarily large positive/negative deltas.
 */
export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const total = year * 12 + month + delta;
  const newYear = Math.floor(total / 12);
  const newMonth = ((total % 12) + 12) % 12;
  return { year: newYear, month: newMonth };
}
