"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BarangayPickerProps {
  barangays: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function BarangayPicker({
  barangays,
  value,
  onValueChange,
  placeholder = "Select barangay…",
  disabled = false,
  className,
  id,
}: BarangayPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            value === "" && "text-muted-foreground",
            className,
          )}
        >
          {value === "" ? placeholder : value}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] rounded-xl border-border p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search barangay…" />
          <CommandList>
            <CommandEmpty>No barangay found.</CommandEmpty>
            <CommandGroup>
              {barangays.map((barangay) => (
                <CommandItem
                  key={barangay}
                  value={barangay}
                  className="rounded-md"
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === barangay ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {barangay}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
