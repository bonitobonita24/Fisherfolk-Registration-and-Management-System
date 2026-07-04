"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type RegistrationType = "ALL" | "NEW" | "RENEWED";

interface RegistrationTypeSelectProps {
  value: RegistrationType;
  onValueChange: (value: RegistrationType) => void;
}

export function RegistrationTypeSelect({
  value,
  onValueChange,
}: RegistrationTypeSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v === "ALL" || v === "NEW" || v === "RENEWED") {
          onValueChange(v);
        }
      }}
    >
      <SelectTrigger
        className="w-full bg-card text-muted-foreground"
        aria-label="Filter by registration type"
      >
        <SelectValue placeholder="Registration type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Registrations</SelectItem>
        <SelectItem value="NEW">New Only</SelectItem>
        <SelectItem value="RENEWED">Renewed Only</SelectItem>
      </SelectContent>
    </Select>
  );
}
