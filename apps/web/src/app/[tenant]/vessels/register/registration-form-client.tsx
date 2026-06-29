"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

import { PhotoUpload } from "@/components/fisherfolk/photo-upload";
import { FormSection, FormActions } from "@/components/shared";

// All numeric inputs are kept as strings in the form; parsing happens in handleSubmit.
const formSchema = z.object({
  mfvrNumber: z.string().min(1, "MFVR number is required"),
  vesselName: z.string(),
  vesselType: z.string().min(1, "Vessel type is required"),
  hullMaterial: z.string(),
  placeBuilt: z.string(),
  yearBuilt: z.string(),
  registeredLength: z.string(),
  registeredBreadth: z.string(),
  registeredDepth: z.string(),
  grossTonnage: z.string(),
  netTonnage: z.string(),
  engineMake: z.string(),
  engineSerialNumber: z.string(),
  horsepower: z.string(),
  homeport: z.string(),
  fishingGearClassification: z.array(z.string()),
  vesselPhoto: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SelectedOwner {
  id: string;
  fullName: string;
  idNumber: string;
}

/** Parse a string to a positive float; returns undefined for empty/invalid. */
function parsePositiveFloat(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = parseFloat(v);
  return isFinite(n) && n > 0 ? n : undefined;
}

/** Parse a string to an integer in [1900,2100]; returns undefined for empty/invalid. */
function parseYear(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = parseInt(v, 10);
  return isFinite(n) && n >= 1900 && n <= 2100 ? n : undefined;
}

/** Return trimmed string or undefined when blank. */
function trimOpt(v: string): string | undefined {
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

export function VesselRegistrationFormClient() {
  const router = useRouter();
  const params = useParams<{ tenant: string }>();
  const tenantSlug = params.tenant;

  const [ownerSearch, setOwnerSearch] = useState("");
  const [selectedOwners, setSelectedOwners] = useState<SelectedOwner[]>([]);
  const [gearInput, setGearInput] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mfvrNumber: "",
      vesselName: "",
      vesselType: "",
      hullMaterial: "",
      placeBuilt: "",
      yearBuilt: "",
      registeredLength: "",
      registeredBreadth: "",
      registeredDepth: "",
      grossTonnage: "",
      netTonnage: "",
      engineMake: "",
      engineSerialNumber: "",
      horsepower: "",
      homeport: "",
      fishingGearClassification: [],
      vesselPhoto: undefined,
    },
  });

  const utils = trpc.useUtils();

  const createMutation = trpc.vessel.create.useMutation({
    onSuccess: (record) => {
      const label = record.vesselName
        ? `${record.vesselName} (${record.mfvrNumber})`
        : record.mfvrNumber;
      toast.success(`Vessel ${label} registered.`);
      void utils.vessel.list.invalidate();
      router.push(`/${tenantSlug}/vessels/${record.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Owner search — fires only when 2+ chars entered
  const ownerListQuery = trpc.fisherfolk.list.useQuery(
    { search: ownerSearch, limit: 10 },
    { enabled: ownerSearch.trim().length >= 2 },
  );

  function handleSubmit(values: FormValues) {
    createMutation.mutate({
      mfvrNumber: values.mfvrNumber.trim(),
      vesselType: values.vesselType,
      vesselName: trimOpt(values.vesselName),
      hullMaterial: trimOpt(values.hullMaterial),
      placeBuilt: trimOpt(values.placeBuilt),
      yearBuilt: parseYear(values.yearBuilt),
      registeredLength: parsePositiveFloat(values.registeredLength),
      registeredBreadth: parsePositiveFloat(values.registeredBreadth),
      registeredDepth: parsePositiveFloat(values.registeredDepth),
      grossTonnage: parsePositiveFloat(values.grossTonnage),
      netTonnage: parsePositiveFloat(values.netTonnage),
      engineMake: trimOpt(values.engineMake),
      engineSerialNumber: trimOpt(values.engineSerialNumber),
      horsepower: parsePositiveFloat(values.horsepower),
      homeport: trimOpt(values.homeport),
      fishingGearClassification: values.fishingGearClassification,
      ...(values.vesselPhoto && { vesselPhoto: values.vesselPhoto }),
      ownerIds: selectedOwners.map((o) => o.id),
    });
  }

  function addGear() {
    const trimmed = gearInput.trim();
    if (trimmed.length === 0) return;
    const current = form.getValues("fishingGearClassification");
    if (!current.includes(trimmed)) {
      form.setValue("fishingGearClassification", [...current, trimmed]);
    }
    setGearInput("");
  }

  function removeGear(gear: string) {
    const current = form.getValues("fishingGearClassification");
    form.setValue(
      "fishingGearClassification",
      current.filter((g) => g !== gear),
    );
  }

  function addOwner(owner: SelectedOwner) {
    if (selectedOwners.some((o) => o.id === owner.id)) return;
    setSelectedOwners((prev) => [...prev, owner]);
    setOwnerSearch("");
  }

  function removeOwner(id: string) {
    setSelectedOwners((prev) => prev.filter((o) => o.id !== id));
  }

  const isSubmitting = createMutation.isPending;
  const gearClassification = form.watch("fishingGearClassification");

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          void form.handleSubmit(handleSubmit)(event);
        }}
        className="space-y-6"
      >
        {/* Identification */}
        <FormSection title="Identification">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="mfvrNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MFVR Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. MFVR-2024-0001" {...field} />
                  </FormControl>
                  <FormDescription>
                    Must be unique within this tenant.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vesselName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vessel Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vesselType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vessel Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Motorized">Motorized</SelectItem>
                      <SelectItem value="Non-Motorized">
                        Non-Motorized
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hullMaterial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hull Material</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Wood">Wood</SelectItem>
                      <SelectItem value="Fiberglass">Fiberglass</SelectItem>
                      <SelectItem value="Composite">Composite</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Construction */}
        <FormSection title="Construction">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="placeBuilt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Place Built</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Calapan City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="yearBuilt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year Built</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 2015"
                      min={1900}
                      max={2100}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Dimensions & Tonnage */}
        <FormSection title="Dimensions &amp; Tonnage">
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="registeredLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registered Length (m)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registeredBreadth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registered Breadth (m)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registeredDepth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registered Depth (m)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grossTonnage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gross Tonnage (GT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="netTonnage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Net Tonnage (NT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Engine */}
        <FormSection title="Engine">
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="engineMake"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engine Make</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Yamaha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="engineSerialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engine Serial Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="horsepower"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horsepower (HP)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Operations */}
        <FormSection title="Operations">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="homeport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Homeport</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Calapan City Port" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fishingGearClassification"
              render={() => (
                <FormItem>
                  <FormLabel>Fishing Gear Classification</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={gearInput}
                      onChange={(e) => setGearInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addGear();
                        }
                      }}
                      placeholder="e.g. Hook and Line"
                    />
                    <Button type="button" variant="outline" onClick={addGear}>
                      Add
                    </Button>
                  </div>
                  {gearClassification.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {gearClassification.map((gear) => (
                        <Badge
                          key={gear}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {gear}
                          <button
                            type="button"
                            onClick={() => removeGear(gear)}
                            className="ml-1 rounded hover:bg-muted"
                            aria-label={`Remove ${gear}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormDescription>
                    Press Enter or click Add after each gear type.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Vessel Photo */}
        <FormSection title="Vessel Photo (optional)">
          <FormField
            control={form.control}
            name="vesselPhoto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vessel photo (optional)</FormLabel>
                <FormControl>
                  <PhotoUpload
                    entityType="vessel-photo"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* Linked Owners */}
        <FormSection title="Linked Owners (optional)">
          <div className="space-y-3">
            <div>
              <Input
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                placeholder="Search fisherfolk by name or ID number…"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Type at least 2 characters to search.
              </p>
            </div>

            {ownerSearch.trim().length >= 2 && (
              <div className="rounded-md border border-border bg-card">
                {ownerListQuery.isLoading && (
                  <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching…
                  </div>
                )}
                {!ownerListQuery.isLoading &&
                  (ownerListQuery.data?.items.length ?? 0) === 0 && (
                    <p className="p-3 text-sm text-muted-foreground">
                      No fisherfolk found for &ldquo;{ownerSearch}&rdquo;.
                    </p>
                  )}
                {(ownerListQuery.data?.items ?? []).map((ff) => {
                  const alreadySelected = selectedOwners.some(
                    (o) => o.id === ff.id,
                  );
                  return (
                    <button
                      key={ff.id}
                      type="button"
                      disabled={alreadySelected}
                      onClick={() =>
                        addOwner({
                          id: ff.id,
                          fullName: ff.fullName,
                          idNumber: ff.idNumber,
                        })
                      }
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="font-medium text-foreground">
                        {ff.fullName}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {ff.idNumber}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedOwners.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Selected owners
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedOwners.map((owner) => (
                    <Badge
                      key={owner.id}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      <span>{owner.fullName}</span>
                      <span className="font-mono text-xs opacity-70">
                        {owner.idNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOwner(owner.id)}
                        className="ml-1 rounded hover:bg-muted"
                        aria-label={`Remove ${owner.fullName}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FormSection>

        {/* Actions */}
        <FormActions>
          <Button type="button" variant="outline" asChild>
            <Link href={`/${tenantSlug}/vessels`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Vessel
          </Button>
        </FormActions>
      </form>
    </Form>
  );
}
