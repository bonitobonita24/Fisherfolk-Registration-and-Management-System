"use client"

import * as React from "react"
import { Check, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Density = "compact" | "comfortable" | "spacious"

const DENSITY_STORAGE_KEY = "frms-density"

const DENSITY_OPTIONS: { key: Density; label: string }[] = [
  { key: "compact", label: "Compact" },
  { key: "comfortable", label: "Comfortable" },
  { key: "spacious", label: "Spacious" },
]

function isDensity(value: string): value is Density {
  return value === "compact" || value === "comfortable" || value === "spacious"
}

export function DensityInit(): null {
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(DENSITY_STORAGE_KEY)
      if (stored !== null && isDensity(stored)) {
        document.documentElement.dataset.density = stored
      }
    } catch {
      // private-mode / storage-disabled: no-op
    }
  }, [])

  return null
}

export function DensityToggle() {
  const [density, setDensity] = React.useState<Density>("comfortable")

  React.useEffect(() => {
    const current = document.documentElement.dataset.density
    if (current !== undefined && isDensity(current)) {
      setDensity(current)
    }
  }, [])

  function handleSelect(key: Density) {
    document.documentElement.dataset.density = key
    try {
      localStorage.setItem(DENSITY_STORAGE_KEY, key)
    } catch {
      // private-mode / storage-disabled: no-op
    }
    setDensity(key)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Display density">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Density</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DENSITY_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.key}
            onSelect={() => handleSelect(option.key)}
          >
            {option.label}
            {density === option.key ? <Check className="ml-auto h-4 w-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
