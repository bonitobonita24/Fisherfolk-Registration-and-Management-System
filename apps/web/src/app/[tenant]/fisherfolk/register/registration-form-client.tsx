"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Wand2 } from "lucide-react";

import { Gender, CivilStatus, EmploymentType } from "@frms/shared/types";
import { CALAPAN_BARANGAYS } from "@frms/shared/constants";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  BarangayPicker,
  CategoryPicker,
  FormSection,
  LocationPicker,
} from "@/components/shared";
import { Stepper } from "@/components/shared/stepper";
import { PhotoUpload } from "@/components/fisherfolk/photo-upload";
import { SignaturePad } from "@/components/fisherfolk/signature-pad";

const STEP_FIELDS = {
  1: [
    "idNumber",
    "firstName",
    "middleName",
    "lastName",
    "suffix",
    "dateOfBirth",
    "sex",
    "civilStatus",
    "contactNumber",
    "rsbsaNumber",
    "employmentType",
    "primarySourceOfIncome",
  ],
  2: ["address", "barangay", "categoryIds"],
  3: ["photo", "signature"],
} as const;

const formSchema = z.object({
  idNumber: z.string().min(1, "ID number is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string(),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date"),
  sex: z.enum([Gender.MALE, Gender.FEMALE], {
    message: "Sex is required",
  }),
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
  employmentType: z
    .enum([EmploymentType.FULL_TIME, EmploymentType.PART_TIME])
    .or(z.literal(""))
    .optional(),
  primarySourceOfIncome: z.string(),
  address: z.string().min(1, "Address is required"),
  barangay: z.string().min(1, "Barangay is required"),
  categoryIds: z
    .array(z.string().cuid())
    .min(1, "Select at least one category"),
  photo: z.string().optional(),
  signature: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const TOTAL_STEPS = 4;
type StepNumber = 1 | 2 | 3 | 4;

interface RegistrationFormClientProps {
  initialValues?: Partial<FormValues>;
}

export function RegistrationFormClient({
  initialValues,
}: RegistrationFormClientProps = {}) {
  const router = useRouter();
  const tenantHref = useTenantHref();
  const [step, setStep] = useState<StepNumber>(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      idNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      dateOfBirth: "",
      sex: Gender.MALE,
      civilStatus: "",
      contactNumber: "",
      rsbsaNumber: "",
      employmentType: "",
      primarySourceOfIncome: "",
      address: "",
      barangay: "",
      categoryIds: [],
      photo: undefined,
      signature: undefined,
      latitude: null,
      longitude: null,
      ...initialValues,
    },
  });

  const suggestQuery = trpc.fisherfolk.generateNextIdNumber.useQuery(
    undefined,
    { enabled: false, staleTime: 0, refetchOnWindowFocus: false },
  );
  const [isSuggesting, setIsSuggesting] = useState(false);

  async function handleSuggestId() {
    setIsSuggesting(true);
    try {
      const result = await suggestQuery.refetch();
      if (result.data?.idNumber) {
        form.setValue("idNumber", result.data.idNumber, { shouldValidate: true });
      }
    } finally {
      setIsSuggesting(false);
    }
  }

  const utils = trpc.useUtils();
  const createMutation = trpc.fisherfolk.create.useMutation({
    onSuccess: (record) => {
      toast.success(`Registered ${record.fullName} (${record.idNumber}).`);
      void utils.fisherfolk.list.invalidate();
      router.push(tenantHref("/fisherfolk"));
      router.refresh();
    },
    onError: (error) => {
      if (error.data?.code === "CONFLICT") {
        toast.error(
          "ID number already exists. Please enter a different ID or click Suggest.",
        );
        return;
      }
      toast.error(error.message);
    },
  });

  const registrationYear = new Date().getFullYear();

  async function handleNext() {
    if (step === 4) return;
    const fields = STEP_FIELDS[step];
    const isValid = await form.trigger(fields, { shouldFocus: true });
    if (isValid) {
      setStep((prev) => (prev < TOTAL_STEPS ? ((prev + 1) as StepNumber) : prev));
    }
  }

  function handleBack() {
    setStep((prev) => (prev > 1 ? ((prev - 1) as StepNumber) : prev));
  }

  function handleSubmit(values: FormValues) {
    const fullName = [
      values.firstName,
      values.middleName,
      values.lastName,
      values.suffix,
    ]
      .filter((part) => part.trim().length > 0)
      .join(" ")
      .trim();

    createMutation.mutate({
      idNumber: values.idNumber.trim(),
      fullName,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      ...(values.middleName.trim().length > 0 && {
        middleName: values.middleName.trim(),
      }),
      ...(values.suffix.trim().length > 0 && { suffix: values.suffix.trim() }),
      dateOfBirth: new Date(values.dateOfBirth),
      sex: values.sex,
      ...(values.civilStatus != null &&
        values.civilStatus !== "" && { civilStatus: values.civilStatus }),
      address: values.address.trim(),
      barangay: values.barangay.trim(),
      ...(values.contactNumber.trim().length > 0 && {
        contactNumber: values.contactNumber.trim(),
      }),
      ...(values.rsbsaNumber.trim().length > 0 && {
        rsbsaNumber: values.rsbsaNumber.trim(),
      }),
      ...(values.employmentType != null &&
        values.employmentType !== "" && {
          employmentType: values.employmentType,
        }),
      ...(values.primarySourceOfIncome.trim().length > 0 && {
        primarySourceOfIncome: values.primarySourceOfIncome.trim(),
      }),
      categoryIds: values.categoryIds,
      ...(values.photo && { photo: values.photo }),
      ...(values.signature && { signature: values.signature }),
      latitude: values.latitude ?? undefined,
      longitude: values.longitude ?? undefined,
      registrationYear,
    });
  }

  const isSubmitting = createMutation.isPending;

  return (
    <Card>
      <CardContent className="space-y-6 px-6 py-5">
      <Stepper steps={["Personal", "Address", "Documents", "Review"]} current={step - 1} />

      <Form {...form}>
        <form
          onSubmit={(event) => {
            void form.handleSubmit(handleSubmit)(event);
          }}
          className="space-y-6"
        >
          {step === 1 && (
            <PersonalStep
              form={form}
              onSuggestId={() => { void handleSuggestId(); }}
              isSuggesting={isSuggesting}
            />
          )}
          {step === 2 && <AddressStep form={form} />}
          {step === 3 && <DocumentsStep form={form} />}
          {step === 4 && (
            <ReviewStep
              values={form.getValues()}
              registrationYear={registrationYear}
            />
          )}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href={tenantHref("/fisherfolk")}>Cancel</Link>
              </Button>
              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={() => {
                    void handleNext();
                  }}
                  disabled={isSubmitting}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Register
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
      </CardContent>
    </Card>
  );
}

interface StepProps {
  form: UseFormReturn<FormValues>;
}

interface PersonalStepProps extends StepProps {
  onSuggestId: () => void;
  isSuggesting: boolean;
}

function PersonalStep({ form, onSuggestId, isSuggesting }: PersonalStepProps) {
  return (
    <FormSection title="Personal Information">
      <div className="grid gap-4 md:grid-cols-2">
      <FormField
        control={form.control}
        name="idNumber"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>ID number *</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input
                  placeholder="e.g. MR-CL-000001-2024 or FF-2025-0001"
                  {...field}
                />
              </FormControl>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSuggestId}
                disabled={isSuggesting}
                className="shrink-0"
              >
                {isSuggesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                <span className="ml-1">Suggest</span>
              </Button>
            </div>
            <FormDescription>
              Enter the official ID in any format (legacy or new), or click
              Suggest to auto-fill the next available FF-YYYY-NNNN number.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
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
                <SelectItem value={CivilStatus.SEPARATED}>Separated</SelectItem>
                <SelectItem value={CivilStatus.DIVORCED}>Divorced</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="employmentType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Employment type</FormLabel>
            <Select
              value={field.value ?? ""}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={EmploymentType.FULL_TIME}>
                  Full-time
                </SelectItem>
                <SelectItem value={EmploymentType.PART_TIME}>
                  Part-time
                </SelectItem>
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
      <FormField
        control={form.control}
        name="primarySourceOfIncome"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Primary source of income</FormLabel>
            <FormControl>
              <Input placeholder="Optional" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      </div>
    </FormSection>
  );
}

function AddressStep({ form }: StepProps) {
  const barangay = form.watch("barangay");
  return (
    <FormSection title="Address & Categories">
      <div className="space-y-4">
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
            <FormDescription>
              {CALAPAN_BARANGAYS.length} Calapan City barangays. Future tenant
              settings will let other LGUs manage their own list.
            </FormDescription>
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
              Select one or more fisherfolk categories. Admins manage the list
              in Settings → Categories.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="latitude"
        render={() => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <LocationPicker
                value={
                  form.watch("latitude") != null && form.watch("longitude") != null
                    ? { lat: form.watch("latitude")!, lng: form.watch("longitude")! }
                    : null
                }
                onChange={(next) => {
                  form.setValue("latitude", next.lat, { shouldValidate: true });
                  form.setValue("longitude", next.lng, { shouldValidate: true });
                }}
                barangay={barangay}
              />
            </FormControl>
            <FormDescription>
              Drag the pin, click the map, or use your current location. The
              pin auto-centers on the selected barangay until moved.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      </div>
    </FormSection>
  );
}

function DocumentsStep({ form }: StepProps) {
  return (
    <FormSection title="Photo & Signature">
      <div className="space-y-6">
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
              Optional. Sign with mouse, finger, or stylus, then click Save.
              The QR code is generated automatically on submission.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      </div>
    </FormSection>
  );
}

interface ReviewStepProps {
  values: FormValues;
  registrationYear: number;
}

function ReviewStep({ values, registrationYear }: ReviewStepProps) {
  const fullName = [
    values.firstName,
    values.middleName,
    values.lastName,
    values.suffix,
  ]
    .filter((part) => part.trim().length > 0)
    .join(" ")
    .trim();

  // Cache hit from CategoryPicker — same query key.
  const categoriesQuery = trpc.category.list.useQuery({ status: "ACTIVE" });
  const categoryNames = (categoriesQuery.data ?? [])
    .filter((c) => values.categoryIds.includes(c.id))
    .map((c) => c.name);
  const categoriesLabel =
    categoryNames.length > 0 ? categoryNames.join(", ") : "—";

  return (
    <FormSection title="Review">
      <div className="space-y-6">
      <section className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          Fisherfolk ID
        </p>
        <p className="mt-1 font-mono text-lg text-foreground">
          {values.idNumber.trim().length > 0 ? values.idNumber.trim() : "—"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Registration year: {registrationYear}. The QR code is generated
          automatically on submission and stored with the record.
        </p>
      </section>

      <ReviewGrid
        rows={[
          ["ID number", values.idNumber.trim().length > 0 ? values.idNumber.trim() : "—"],
          ["Full name", fullName.length > 0 ? fullName : "—"],
          ["First name", values.firstName],
          ["Middle name", values.middleName.length > 0 ? values.middleName : "—"],
          ["Last name", values.lastName],
          ["Suffix", values.suffix.length > 0 ? values.suffix : "—"],
          ["Date of birth", values.dateOfBirth],
          ["Sex", values.sex],
          [
            "Civil status",
            values.civilStatus != null && values.civilStatus !== ""
              ? values.civilStatus
              : "—",
          ],
          [
            "Contact number",
            values.contactNumber.length > 0 ? values.contactNumber : "—",
          ],
          [
            "RSBSA number",
            values.rsbsaNumber.length > 0 ? values.rsbsaNumber : "—",
          ],
          [
            "Employment type",
            values.employmentType != null && values.employmentType !== ""
              ? values.employmentType
              : "—",
          ],
          [
            "Primary source of income",
            values.primarySourceOfIncome.length > 0
              ? values.primarySourceOfIncome
              : "—",
          ],
          ["Address", values.address],
          ["Barangay", values.barangay],
          ["Categories", categoriesLabel],
          ["Photo", values.photo ? "Uploaded" : "Not provided"],
          ["Signature", values.signature ? "Captured" : "Not provided"],
          ["QR code", "Auto-generated on submit"],
        ]}
      />
      </div>
    </FormSection>
  );
}

function ReviewGrid({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 md:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="space-y-0.5">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </dt>
          <dd className="text-sm text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
