import { describe, expect, it } from "vitest";
import {
  addMonths,
  isOverdue,
  monthMatrix,
  sourceEntityLink,
} from "../todo-source";

describe("sourceEntityLink", () => {
  it("builds a link for each known source entity type", () => {
    expect(sourceEntityLink("fisherfolk", "abc", "calapan-city")).toEqual({
      href: "/calapan-city/fisherfolk/abc",
      label: "Fisherfolk",
    });
    expect(sourceEntityLink("vessel", "abc", "calapan-city")).toEqual({
      href: "/calapan-city/vessels/abc",
      label: "Vessel",
    });
    expect(sourceEntityLink("violation", "abc", "calapan-city")).toEqual({
      href: "/calapan-city/violations/abc",
      label: "Violation",
    });
    expect(sourceEntityLink("ayudaProgram", "abc", "calapan-city")).toEqual({
      href: "/calapan-city/ayuda/abc",
      label: "Ayuda",
    });
  });

  it("returns null when type or id is missing/unknown", () => {
    expect(sourceEntityLink(null, "abc", "calapan-city")).toBeNull();
    expect(sourceEntityLink(undefined, "abc", "calapan-city")).toBeNull();
    expect(sourceEntityLink("fisherfolk", null, "calapan-city")).toBeNull();
    expect(sourceEntityLink("fisherfolk", undefined, "calapan-city")).toBeNull();
    expect(sourceEntityLink("household", "abc", "calapan-city")).toBeNull();
  });
});

describe("isOverdue", () => {
  it("is true when due date is in the past and status is not DONE", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isOverdue(yesterday, "TODO")).toBe(true);
  });

  it("is false when due date is in the past but status is DONE", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isOverdue(yesterday, "DONE")).toBe(false);
  });

  it("is false when due date is in the future", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isOverdue(tomorrow, "TODO")).toBe(false);
  });

  it("is false when due date is missing", () => {
    expect(isOverdue(null, "TODO")).toBe(false);
    expect(isOverdue(undefined, "TODO")).toBe(false);
  });
});

describe("monthMatrix", () => {
  it("builds a correct grid for February 2026 (starts on Sunday)", () => {
    // Feb 1 2026 is a Sunday.
    const weeks = monthMatrix(2026, 1);
    expect(weeks[0]?.[0]?.getDate()).toBe(1);
    expect(weeks[0]?.[0]?.getMonth()).toBe(1);

    const flat = weeks.flat();
    const inMonth = flat.filter((d) => d !== null);
    expect(inMonth.length).toBe(28); // 2026 is not a leap year
    for (const week of weeks) {
      expect(week.length).toBe(7);
    }
  });

  it("builds a correct grid for a month not starting on Sunday (Jan 2026)", () => {
    // Jan 1 2026 is a Thursday (day index 4).
    const weeks = monthMatrix(2026, 0);
    const firstWeek = weeks[0];
    expect(firstWeek?.slice(0, 4).every((c) => c === null)).toBe(true);
    expect(firstWeek?.[4]?.getDate()).toBe(1);

    const inMonth = weeks.flat().filter((d) => d !== null);
    expect(inMonth.length).toBe(31);
  });

  it("handles leap years correctly (Feb 2028)", () => {
    const weeks = monthMatrix(2028, 1);
    const inMonth = weeks.flat().filter((d) => d !== null);
    expect(inMonth.length).toBe(29);
  });
});

describe("addMonths", () => {
  it("rolls the year forward from December to January", () => {
    expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
  });

  it("rolls the year backward from January to December", () => {
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });

  it("handles multi-month deltas within the same year", () => {
    expect(addMonths(2026, 3, 2)).toEqual({ year: 2026, month: 5 });
  });
});
