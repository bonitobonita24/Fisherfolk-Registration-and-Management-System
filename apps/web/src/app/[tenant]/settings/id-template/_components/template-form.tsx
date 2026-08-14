"use client";

import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TemplateFormValues {
  name: string;
  templateType: "FISHERFOLK" | "VESSEL";
  status: "ACTIVE" | "ARCHIVED";
}

interface TemplateFormProps {
  values: TemplateFormValues;
  isEditMode: boolean;
  isSaving: boolean;
  onChange: (updates: Partial<TemplateFormValues>) => void;
  onSave: () => void;
}

export function TemplateForm({
  values,
  isEditMode,
  isSaving,
  onChange,
  onSave,
}: TemplateFormProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
      {/* Name */}
      <div className="min-w-[160px] flex-1 space-y-1">
        <Label htmlFor="tpl-name" className="text-xs">
          Template Name
        </Label>
        <Input
          id="tpl-name"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Fisherfolk ID 2025"
          className="h-8 text-sm"
          required
        />
      </div>

      {/* Template type */}
      <div className="w-36 space-y-1">
        <Label htmlFor="tpl-type" className="text-xs">
          Type
        </Label>
        <Select
          value={values.templateType}
          onValueChange={(v) =>
            onChange({ templateType: v as "FISHERFOLK" | "VESSEL" })
          }
        >
          <SelectTrigger id="tpl-type" className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-52">
            <SelectItem value="FISHERFOLK">Fisherfolk</SelectItem>
            <SelectItem value="VESSEL">Vessel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="w-32 space-y-1">
        <Label htmlFor="tpl-status" className="text-xs">
          Status
        </Label>
        <Select
          value={values.status}
          onValueChange={(v) =>
            onChange({ status: v as "ACTIVE" | "ARCHIVED" })
          }
        >
          <SelectTrigger id="tpl-status" className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-52">
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Save button */}
      <Button
        size="sm"
        className="h-8 shrink-0"
        onClick={onSave}
        disabled={isSaving || !values.name.trim()}
        aria-label={isEditMode ? "Update template" : "Create template"}
      >
        {isSaving ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="mr-1.5 h-3.5 w-3.5" />
        )}
        {isEditMode ? "Update" : "Create"}
      </Button>
    </div>
  );
}
