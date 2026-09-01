"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

import {
  CALAPAN_BARANGAYS,
  GEAR_TYPE_LABELS,
  CATCH_DISPOSITION_LABELS,
  COMMON_FISH_SPECIES,
} from "@frms/shared/constants";
import type { GearType, CatchDisposition } from "@frms/shared/types";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarangayPicker,
  FormSection,
  FormActions,
  LocationPicker,
} from "@/components/shared";

const GEAR_TYPES = Object.keys(GEAR_TYPE_LABELS) as GearType[];
const DISPOSITIONS = Object.keys(CATCH_DISPOSITION_LABELS) as CatchDisposition[];
const SOURCES = ["FMO_ENUMERATOR", "SELF_REPORT", "NSAP_SAMPLING", "IMPORT"] as const;
const SOURCE_LABELS: Record<(typeof SOURCES)[number], string> = {
  FMO_ENUMERATOR: "FMO Enumerator",
  SELF_REPORT: "Self-Report",
  NSAP_SAMPLING: "NSAP Sampling",
  IMPORT: "Import",
};

// All numeric/date inputs are kept as strings in the form; parsing happens in handleSubmit.
const speciesRowSchema = z.object({
  commonName: z.string().min(1, "Species name is required"),
  scientificName: z.string(),
  weightKg: z.string().min(1, "Weight is required"),
  quantityPcs: z.string(),
  pricePerKgPhp: z.string(),
  valuePhp: z.string(),
  disposition: z.string(),
});

const formSchema = z.object({
  fisherfolkId: z.string().min(1, "Fisherfolk is required"),
  vesselId: z.string(),
  landingDate: z.string().min(1, "Landing date is required"),
  landingTime: z.string(),
  gearType: z.string().min(1, "Gear type is required"),
  gearDetail: z.string(),
  gearUnits: z.string(),
  fishingHours: z.string(),
  numTrips: z.string().min(1, "Number of trips is required"),
  numFishers: z.string(),
  fishingGroundBarangay: z.string(),
  fishingGroundLabel: z.string(),
  fmaCode: z.string(),
  totalCatchKg: z.string(),
  estimatedValuePhp: z.string(),
  disposition: z.string(),
  source: z.string().min(1),
  remarks: z.string(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  species: z.array(speciesRowSchema).min(1, "Add at least one species"),
});

type FormValues = z.infer<typeof formSchema>;

interface SelectedFisherfolk {
  id: string;
  fullName: string;
  idNumber: string;
}

/** Parse a string to a nonnegative float; returns undefined for empty/invalid. */
function parseNonnegativeFloat(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = parseFloat(v);
  return isFinite(n) && n >= 0 ? n : undefined;
}

/** Parse a string to a nonnegative integer; returns undefined for empty/invalid. */
function parseNonnegativeInt(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = parseInt(v, 10);
  return isFinite(n) && n >= 0 ? n : undefined;
}

/** Return trimmed string or undefined when blank. */
function trimOpt(v: string): string | undefined {
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

const EMPTY_SPECIES_ROW = {
  commonName: "",
  scientificName: "",
  weightKg: "",
  quantityPcs: "",
  pricePerKgPhp: "",
  valuePhp: "",
  disposition: "",
};

export function FishCatchFormClient() {
  const router = useRouter();
  const tenantHref = useTenantHref();

  const [fisherfolkSearch, setFisherfolkSearch] = useState("");
  const [selectedFisherfolk, setSelectedFisherfolk] =
    useState<SelectedFisherfolk | null>(null);
  const [vesselSearch, setVesselSearch] = useState("");
  const [selectedVessel, setSelectedVessel] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fisherfolkId: "",
      vesselId: "",
      landingDate: "",
      landingTime: "",
      gearType: "",
      gearDetail: "",
      gearUnits: "",
      fishingHours: "",
      numTrips: "1",
      numFishers: "",
      fishingGroundBarangay: "",
      fishingGroundLabel: "",
      fmaCode: "",
      totalCatchKg: "",
      estimatedValuePhp: "",
      disposition: "",
      source: "FMO_ENUMERATOR",
      remarks: "",
      latitude: null,
      longitude: null,
      species: [EMPTY_SPECIES_ROW],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "species",
  });

  const speciesRows = form.watch("species");
  const computedTotalKg = useMemo(
    () =>
      speciesRows.reduce((sum, row) => {
        const w = parseFloat(row.weightKg);
        return sum + (isFinite(w) ? w : 0);
      }, 0),
    [speciesRows],
  );

  const utils = trpc.useUtils();

  const createMutation = trpc.fishCatch.create.useMutation({
    onSuccess: (record) => {
      toast.success(`Fish catch record ${record.referenceNo} saved.`);
      void utils.fishCatch.list.invalidate();
      router.push(tenantHref(`/fish-catches/${record.id}`));
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Fisherfolk search — fires only when 2+ chars entered
  const fisherfolkQuery = trpc.fisherfolk.list.useQuery(
    { search: fisherfolkSearch, limit: 10 },
    { enabled: fisherfolkSearch.trim().length >= 2 },
  );

  // Vessel search — optionally scoped to the selected fisherfolk as owner
  const vesselQuery = trpc.vessel.list.useQuery(
    {
      search: vesselSearch || undefined,
      limit: 10,
      ...(selectedFisherfolk && { fisherfolkId: selectedFisherfolk.id }),
    },
    { enabled: vesselSearch.trim().length >= 2 || !!selectedFisherfolk },
  );

  function selectFisherfolk(ff: SelectedFisherfolk) {
    setSelectedFisherfolk(ff);
    form.setValue("fisherfolkId", ff.id, { shouldValidate: true });
    setFisherfolkSearch("");
  }

  function clearFisherfolk() {
    setSelectedFisherfolk(null);
    form.setValue("fisherfolkId", "", { shouldValidate: true });
  }

  function selectVessel(v: { id: string; label: string }) {
    setSelectedVessel(v);
    form.setValue("vesselId", v.id);
    setVesselSearch("");
  }

  function clearVessel() {
    setSelectedVessel(null);
    form.setValue("vesselId", "");
  }

  function addSpeciesRow() {
    append({ ...EMPTY_SPECIES_ROW });
  }

  function selectCommonSpecies(index: number, commonName: string) {
    const match = COMMON_FISH_SPECIES.find((s) => s.commonName === commonName);
    form.setValue(`species.${index}.commonName`, commonName);
    if (match) {
      form.setValue(`species.${index}.scientificName`, match.scientificName);
    }
  }

  function handleSubmit(values: FormValues) {
    const totalCatchKg =
      parseNonnegativeFloat(values.totalCatchKg) ?? computedTotalKg;

    createMutation.mutate({
      fisherfolkId: values.fisherfolkId,
      vesselId: trimOpt(values.vesselId),
      landingDate: new Date(values.landingDate),
      landingTime: trimOpt(values.landingTime),
      fishingGroundBarangay: trimOpt(values.fishingGroundBarangay),
      fishingGroundLabel: trimOpt(values.fishingGroundLabel),
      fmaCode: trimOpt(values.fmaCode),
      gearType: values.gearType as GearType,
      gearDetail: trimOpt(values.gearDetail),
      gearUnits: parseNonnegativeInt(values.gearUnits),
      fishingHours: parseNonnegativeFloat(values.fishingHours),
      numTrips: parseNonnegativeInt(values.numTrips) ?? 1,
      numFishers: parseNonnegativeInt(values.numFishers),
      totalCatchKg,
      estimatedValuePhp: parseNonnegativeFloat(values.estimatedValuePhp),
      disposition: (trimOpt(values.disposition) as CatchDisposition) ?? undefined,
      remarks: trimOpt(values.remarks),
      latitude: values.latitude ?? undefined,
      longitude: values.longitude ?? undefined,
      source: values.source as
        | "FMO_ENUMERATOR"
        | "SELF_REPORT"
        | "NSAP_SAMPLING"
        | "IMPORT",
      species: values.species.map((s) => ({
        commonName: s.commonName.trim(),
        scientificName: trimOpt(s.scientificName),
        weightKg: parseNonnegativeFloat(s.weightKg) ?? 0,
        quantityPcs: parseNonnegativeInt(s.quantityPcs),
        pricePerKgPhp: parseNonnegativeFloat(s.pricePerKgPhp),
        valuePhp: parseNonnegativeFloat(s.valuePhp),
        disposition: (trimOpt(s.disposition) as CatchDisposition) ?? undefined,
      })),
    });
  }

  const isSubmitting = createMutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          void form.handleSubmit(handleSubmit)(event);
        }}
        className="space-y-6"
      >
        {/* Fisherfolk & Vessel */}
        <FormSection title="Fisherfolk &amp; Vessel">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="fisherfolkId"
              render={() => (
                <FormItem>
                  <FormLabel>Fisherfolk *</FormLabel>
                  {selectedFisherfolk ? (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {selectedFisherfolk.fullName}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {selectedFisherfolk.idNumber}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearFisherfolk}
                        aria-label="Clear selected fisherfolk"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <FormControl>
                        <Input
                          value={fisherfolkSearch}
                          onChange={(e) => setFisherfolkSearch(e.target.value)}
                          placeholder="Search fisherfolk by name or ID number…"
                          aria-label="Search fisherfolk"
                        />
                      </FormControl>
                      <FormDescription>
                        Type at least 2 characters to search.
                      </FormDescription>
                      {fisherfolkSearch.trim().length >= 2 && (
                        <div className="rounded-lg border border-border bg-card">
                          {fisherfolkQuery.isLoading && (
                            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Searching…
                            </div>
                          )}
                          {!fisherfolkQuery.isLoading &&
                            (fisherfolkQuery.data?.items.length ?? 0) === 0 && (
                              <p className="p-3 text-sm text-muted-foreground">
                                No fisherfolk found for &ldquo;{fisherfolkSearch}
                                &rdquo;.
                              </p>
                            )}
                          {(fisherfolkQuery.data?.items ?? []).map((ff) => (
                            <button
                              key={ff.id}
                              type="button"
                              onClick={() =>
                                selectFisherfolk({
                                  id: ff.id,
                                  fullName: ff.fullName,
                                  idNumber: ff.idNumber,
                                })
                              }
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                            >
                              <span className="font-medium text-foreground">
                                {ff.fullName}
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {ff.idNumber}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vesselId"
              render={() => (
                <FormItem>
                  <FormLabel>Vessel (optional)</FormLabel>
                  {selectedVessel ? (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                      <p className="font-medium text-foreground">
                        {selectedVessel.label}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearVessel}
                        aria-label="Clear selected vessel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <FormControl>
                        <Input
                          value={vesselSearch}
                          onChange={(e) => setVesselSearch(e.target.value)}
                          placeholder="Search vessel by MFVR number or name…"
                          aria-label="Search vessel"
                        />
                      </FormControl>
                      {(vesselSearch.trim().length >= 2 ||
                        !!selectedFisherfolk) && (
                        <div className="rounded-lg border border-border bg-card">
                          {vesselQuery.isLoading && (
                            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Searching…
                            </div>
                          )}
                          {!vesselQuery.isLoading &&
                            (vesselQuery.data?.items.length ?? 0) === 0 && (
                              <p className="p-3 text-sm text-muted-foreground">
                                No vessels found.
                              </p>
                            )}
                          {(vesselQuery.data?.items ?? []).map((v) => {
                            const label = v.vesselName
                              ? `${v.vesselName} (${v.mfvrNumber})`
                              : v.mfvrNumber;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => selectVessel({ id: v.id, label })}
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                              >
                                <span className="font-medium text-foreground">
                                  {label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Landing & Effort */}
        <FormSection title="Landing &amp; Effort">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="landingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Landing Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="landingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Landing Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gearType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gear Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger aria-label="Gear type">
                        <SelectValue placeholder="Select gear type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-56">
                      {GEAR_TYPES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {GEAR_TYPE_LABELS[g]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gearDetail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gear Detail</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gearUnits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gear Units</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fishingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fishing Hours</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numTrips"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Trips *</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" step="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numFishers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Fishers</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fishingGroundBarangay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="fishing-ground-barangay">
                    Fishing Ground Barangay
                  </FormLabel>
                  <FormControl>
                    <BarangayPicker
                      id="fishing-ground-barangay"
                      barangays={CALAPAN_BARANGAYS}
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fishingGroundLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fishing Ground Label</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Verde Island Passage" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="latitude"
              render={() => (
                <FormItem>
                  <FormLabel>Fishing Ground Location</FormLabel>
                  <FormControl>
                    <LocationPicker
                      value={
                        form.watch("latitude") != null &&
                        form.watch("longitude") != null
                          ? {
                              lat: form.watch("latitude")!,
                              lng: form.watch("longitude")!,
                            }
                          : null
                      }
                      onChange={(next) => {
                        form.setValue("latitude", next.lat, {
                          shouldValidate: true,
                        });
                        form.setValue("longitude", next.lng, {
                          shouldValidate: true,
                        });
                      }}
                      barangay={form.watch("fishingGroundBarangay")}
                    />
                  </FormControl>
                  <FormDescription>
                    Drag the pin, click the map, or use your current
                    location. The pin auto-centers on the selected fishing
                    ground barangay until moved.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fmaCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>FMA Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. FMA 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Catch Composition */}
        <FormSection
          title="Catch Composition"
          description="List each species caught. Total catch weight is auto-summed from the rows below."
        >
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-6"
              >
                <FormField
                  control={form.control}
                  name={`species.${index}.commonName`}
                  render={({ field: rowField }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Common Name *</FormLabel>
                      <FormControl>
                        <>
                          <Input
                            aria-label="Common Name"
                            list={`common-fish-species-${index}`}
                            {...rowField}
                            onChange={(e) => {
                              rowField.onChange(e);
                              selectCommonSpecies(index, e.target.value);
                            }}
                          />
                          <datalist id={`common-fish-species-${index}`}>
                            {COMMON_FISH_SPECIES.map((s) => (
                              <option key={s.commonName} value={s.commonName} />
                            ))}
                          </datalist>
                        </>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`species.${index}.scientificName`}
                  render={({ field: rowField }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Scientific Name</FormLabel>
                      <FormControl>
                        <Input {...rowField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`species.${index}.weightKg`}
                  render={({ field: rowField }) => (
                    <FormItem>
                      <FormLabel>Weight (kg) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...rowField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`species.${index}.quantityPcs`}
                  render={({ field: rowField }) => (
                    <FormItem>
                      <FormLabel>Qty (pcs)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" {...rowField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`species.${index}.pricePerKgPhp`}
                  render={({ field: rowField }) => (
                    <FormItem>
                      <FormLabel>Price/kg (₱)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...rowField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`species.${index}.valuePhp`}
                  render={({ field: rowField }) => (
                    <FormItem>
                      <FormLabel>Value (₱)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...rowField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`species.${index}.disposition`}
                  render={({ field: rowField }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Disposition</FormLabel>
                      <Select
                        value={rowField.value}
                        onValueChange={rowField.onChange}
                      >
                        <FormControl>
                          <SelectTrigger aria-label={`Disposition for row ${index + 1}`}>
                            <SelectValue placeholder="Select disposition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="w-56">
                          {DISPOSITIONS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {CATCH_DISPOSITION_LABELS[d]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end md:col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    aria-label={`Remove species row ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addSpeciesRow}>
              <Plus className="mr-2 h-4 w-4" />
              Add Species
            </Button>
            {form.formState.errors.species?.root && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.species.root.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Computed total: <span className="font-medium">{computedTotalKg.toFixed(2)} kg</span>
            </p>
          </div>
        </FormSection>

        {/* Other */}
        <FormSection title="Other">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="totalCatchKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Catch (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={computedTotalKg.toFixed(2)}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Defaults to the sum of species weights if left blank.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estimatedValuePhp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Value (₱)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="disposition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Disposition</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger aria-label="Overall disposition">
                        <SelectValue placeholder="Select disposition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-56">
                      {DISPOSITIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {CATCH_DISPOSITION_LABELS[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger aria-label="Record source">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-56">
                      {SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SOURCE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Actions */}
        <FormActions>
          <Button type="button" variant="outline" asChild>
            <Link href={tenantHref("/fish-catches")}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Catch Record
          </Button>
        </FormActions>
      </form>
    </Form>
  );
}
