"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface YearSelectProps {
  value: number;
  onValueChange: (year: number) => void;
}

export function YearSelect({ value, onValueChange }: YearSelectProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onValueChange(Number(v))}
    >
      <SelectTrigger
        className="h-8 w-full text-muted-foreground"
        aria-label="Registration year"
      >
        <SelectValue placeholder="Year" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={String(value)}>{value}</SelectItem>
      </SelectContent>
    </Select>
  );
}
