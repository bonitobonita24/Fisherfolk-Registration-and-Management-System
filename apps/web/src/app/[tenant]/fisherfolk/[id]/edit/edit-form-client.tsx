"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Info } from "lucide-react";

import { Gender, CivilStatus } from "@frms/shared/types";
import { CALAPAN_BARANGAYS } from "@frms/shared/constants";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { BarangayPicker, CategoryPicker, FormActions } from "@/components/shared";
import { PhotoUpload } from "@/components/fisherfolk/photo-upload";
import { SignaturePad } from "@/components/fisherfolk/signature-pad";

// ---------------------------------------------------------------------------
// Form schema — mirrors the editable fields from fisherfolkUpdateSchema
// (excludes system fields: id, qrCode, status, registrationYear, createdById,
//  updatedById, dateJoined, remarks — not exposed to encoders on this form)
// ---------------------------------------------------------------------------
const editFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string(),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  sex: z.enum([Gender.MALE, Gender.FEMALE], { message: "Sex is required" }),
  civilStatus: z
    .enum([
      CivilStatus.SINGLE,
      CivilStatus.MARRIED,
      CivilStatus.WIDOWED,
      CivilStatus.SEPARATED,
      CivilStatus.DIVORCED,
    ])
    .or(z.literal(""))
    .optional(),
  contactNumber: z.string(),
  rsbsaNumber: z.string(),
  address: z.string().min(1, "Address is required"),
  barangay: z.string().min(1, "Barangay is required"),
  categoryIds: z.array(z.string().cuid()).min(1, "Select at least one category"),
  photo: z.string().optional(),
  signature: z.string().optional(),
});

type EditFormValues = z.infer<typeof editFormSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function toDateInputValue(v: Date | string | null | undefined): string {
  if (v === null || v === undefined || v === "") return "";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Inner form — rendered once the fisherfolk record is loaded
// ---------------------------------------------------------------------------
interface EditFormProps {
  id: string;
  record: {
    firstName: string;
    middleName: string | null;
    lastName: string;
    suffix: string | null;
    dateOfBirth: Date | string | null;
    sex: string | null;
    civilStatus: string | null;
    contactNumber: string | null;
    rsbsaNumber: string | null;
    address: string;
    barangay: string;
    categoryIds: string[];
    photo: string | null;
    signature: string | null;
  };
}

function EditForm({ id, record }: EditFormProps) {
  const router = useRouter();
  const params = useParams<{ tenant: string }>();
  const tenantSlug = params.tenant;

  const utils = trpc.useUtils();

  const completeRecordMutation = trpc.fisherfolk.completeRecord.useMutation({
    onSuccess: () => {
      toast.success("Record updated.");
      void utils.fisherfolk.getById.invalidate({ id });
      router.push(`/${tenantSlug}/fisherfolk/${id}`);
    },
    onError: (err) => {
      if (err.data?.code === "FORBIDDEN") {
        // Server rejected because a field was already populated — fall through
        // to edit request (handled in handleSubmit catch path below).
        return;
      }
      toast.error(err.message);
    },
  });

  const editRequestMutation = trpc.editRequest.create.useMutation({
    onSuccess: () => {
      toast.success("Edit request submitted for admin approval.");
      void utils.fisherfolk.getById.invalidate({ id });
      router.push(`/${tenantSlug}/fisherfolk/${id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      firstName: record.firstName,
      middleName: record.middleName ?? "",
      lastName: record.lastName,
      suffix: record.suffix ?? "",
      dateOfBirth: toDateInputValue(record.dateOfBirth),
      sex:
        record.sex === Gender.FEMALE ? Gender.FEMALE : Gender.MALE,
      civilStatus: (record.civilStatus as EditFormValues["civilStatus"]) ?? "",
      contactNumber: record.contactNumber ?? "",
      rsbsaNumber: record.rsbsaNumber ?? "",
      address: record.address,
      barangay: record.barangay,
      categoryIds: record.categoryIds,
      photo: record.photo ?? undefined,
      signature: record.signature ?? undefined,
    },
  });

  function handleSubmit(values: EditFormValues) {
    // ------------------------------------------------------------------
    // 1. Compute diff — collect only keys whose value has changed
    // ------------------------------------------------------------------
    const changes: Record<string, unknown> = {};

    const compareString = (
      formVal: string,
      recordVal: string | null | undefined,
    ) => {
      const normalised = formVal.trim();
      const original = (recordVal ?? "").trim();
      return normalised !== original ? normalised || null : undefined;
    };

    const nameFields = ["firstName", "middleName", "lastName", "suffix"] as const;
    for (const f of nameFields) {
      const diff = compareString(values[f], record[f]);
      if (diff !== undefined) changes[f] = diff === "" ? null : diff;
    }

    // dateOfBirth
    if (values.dateOfBirth) {
      const newDate = new Date(values.dateOfBirth);
      const oldDate =
        record.dateOfBirth instanceof Date
          ? record.dateOfBirth
          : record.dateOfBirth != null
            ? new Date(record.dateOfBirth)
            : null;
      if (
        !Number.isNaN(newDate.getTime()) &&
        newDate.toISOString().slice(0, 10) !==
          (oldDate != null ? oldDate.toISOString().slice(0, 10) : null)
      ) {
        changes.dateOfBirth = newDate;
      }
    }

    if (values.sex !== record.sex) changes.sex = values.sex;

    const newCivil = values.civilStatus ?? "";
    const oldCivil = record.civilStatus ?? "";
    if (newCivil !== oldCivil) changes.civilStatus = newCivil || null;

    const diffContact = compareString(values.contactNumber, record.contactNumber);
    if (diffContact !== undefined) changes.contactNumber = diffContact;

    const diffRsbsa = compareString(values.rsbsaNumber, record.rsbsaNumber);
    if (diffRsbsa !== undefined) changes.rsbsaNumber = diffRsbsa;

    const diffAddress = compareString(values.address, record.address);
    if (diffAddress !== undefined) changes.address = diffAddress;

    const diffBarangay = compareString(values.barangay, record.barangay);
    if (diffBarangay !== undefined) changes.barangay = diffBarangay;

    // categoryIds — compare sorted arrays
    const newCats = [...values.categoryIds].sort();
    const oldCats = [...record.categoryIds].sort();
    if (JSON.stringify(newCats) !== JSON.stringify(oldCats)) {
      changes.categoryIds = values.categoryIds;
    }

    // photo / signature — only if changed from original storage key
    if ((values.photo ?? null) !== (record.photo ?? null)) {
      changes.photo = values.photo ?? null;
    }
    if ((values.signature ?? null) !== (record.signature ?? null)) {
      changes.signature = values.signature ?? null;
    }

    // ------------------------------------------------------------------
    // 2. Nothing changed
    // ------------------------------------------------------------------
    if (Object.keys(changes).length === 0) {
      toast.info("No changes to submit.");
      return;
    }

    // ------------------------------------------------------------------
    // 3. Partition: fill-empty vs overwrite-populated
    //    A change is "fill-empty" when the CURRENT record value is empty.
    // ------------------------------------------------------------------
    const currentRecord = record as Record<string, unknown>;
    const allFillEmpty = Object.keys(changes).every((k) =>
      isEmpty(currentRecord[k]),
    );

    if (allFillEmpty) {
      // Direct apply — no approval needed (PD-004)
      completeRecordMutation.mutate({ id, changes });
    } else {
      // Requires admin approval
      editRequestMutation.mutate({ fisherfolkId: id, fieldChanges: changes });
    }
  }

  const isSubmitting =
    completeRecordMutation.isPending || editRequestMutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          void form.handleSubmit(handleSubmit)(e);
        }}
        className="space-y-6"
      >
        {/* Notice banner */}
        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Filling in blank fields saves immediately. Changing a field that
            already has a value creates an edit request that requires admin
            approval.
          </p>
        </div>

        {/* Personal details */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle name</FormLabel>
                  <FormControl>
                    <Input placeholder="Santos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Dela Cruz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="suffix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suffix</FormLabel>
                  <FormControl>
                    <Input placeholder="Jr., Sr., III" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of birth *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sex *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>Male</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="civilStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Civil status</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select civil status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={CivilStatus.SINGLE}>Single</SelectItem>
                      <SelectItem value={CivilStatus.MARRIED}>Married</SelectItem>
                      <SelectItem value={CivilStatus.WIDOWED}>Widowed</SelectItem>
                      <SelectItem value={CivilStatus.SEPARATED}>
                        Separated
                      </SelectItem>
                      <SelectItem value={CivilStatus.DIVORCED}>Divorced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact number</FormLabel>
                  <FormControl>
                    <Input placeholder="09XX XXX XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rsbsaNumber"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>RSBSA number</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormDescription>
                    Registry System for Basic Sectors in Agriculture.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Address & categories */}
        <Card>
          <CardHeader>
            <CardTitle>Address &amp; Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full address *</FormLabel>
                  <FormControl>
                    <Input placeholder="House #, Street, Purok" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="barangay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barangay *</FormLabel>
                  <FormControl>
                    <BarangayPicker
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
              name="categoryIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categories *</FormLabel>
                  <FormControl>
                    <CategoryPicker
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Select one or more fisherfolk categories.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID photo</FormLabel>
                  <FormControl>
                    <PhotoUpload
                      value={field.value}
                      onChange={(key) => field.onChange(key)}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional passport-style photo. JPEG, PNG, or WEBP up to 2MB.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="signature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signature</FormLabel>
                  <FormControl>
                    <SignaturePad
                      value={field.value}
                      onChange={(key) => field.onChange(key)}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Sign with mouse, finger, or stylus, then click
                    Save.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <FormActions>
          <Button type="button" variant="outline" asChild>
            <Link href={`/${tenantSlug}/fisherfolk/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </FormActions>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Outer shell — fetches the record, passes it to EditForm
// ---------------------------------------------------------------------------
interface FisherfolkEditFormClientProps {
  id: string;
}

export function FisherfolkEditFormClient({ id }: FisherfolkEditFormClientProps) {
  const params = useParams<{ tenant: string }>();
  const tenantSlug = params.tenant;

  const { data: record, isLoading, isError, error } = trpc.fisherfolk.getById.useQuery({ id });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading fisherfolk…</p>;
  }

  if (isError) {
    const notFound = error?.data?.code === "NOT_FOUND";
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${tenantSlug}/fisherfolk`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {notFound
                ? "Fisherfolk not found."
                : "Failed to load fisherfolk."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${tenantSlug}/fisherfolk/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Edit — {record.fullName}
          </h1>
          <p className="text-sm text-muted-foreground">{record.idNumber}</p>
        </div>
      </div>

      <EditForm
        id={id}
        record={{
          firstName: record.firstName,
          middleName: record.middleName ?? null,
          lastName: record.lastName,
          suffix: record.suffix ?? null,
          dateOfBirth: record.dateOfBirth,
          sex: record.sex,
          civilStatus: record.civilStatus ?? null,
          contactNumber: record.contactNumber ?? null,
          rsbsaNumber: record.rsbsaNumber ?? null,
          address: record.address,
          barangay: record.barangay,
          categoryIds: record.categoryIds ?? [],
          photo: record.photo ?? null,
          signature: record.signature ?? null,
        }}
      />
    </div>
  );
}
