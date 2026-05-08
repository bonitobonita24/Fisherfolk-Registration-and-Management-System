"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Gender, CivilStatus } from "@frms/shared/types";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const STEP_FIELDS = {
  1: [
    "firstName",
    "middleName",
    "lastName",
    "suffix",
    "dateOfBirth",
    "sex",
    "civilStatus",
    "contactNumber",
    "rsbsaNumber",
  ],
  2: ["address", "barangay"],
} as const;

const formSchema = z.object({
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
  address: z.string().min(1, "Address is required"),
  barangay: z.string().min(1, "Barangay is required"),
});

type FormValues = z.infer<typeof formSchema>;

const TOTAL_STEPS = 3;

export function RegistrationFormClient() {
  const router = useRouter();
  const params = useParams<{ tenant: string }>();
  const tenantSlug = params.tenant;
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      dateOfBirth: "",
      sex: Gender.MALE,
      civilStatus: "",
      contactNumber: "",
      rsbsaNumber: "",
      address: "",
      barangay: "",
    },
  });

  const idNumberQuery = trpc.fisherfolk.generateNextIdNumber.useQuery(
    undefined,
    { staleTime: 0, refetchOnWindowFocus: false },
  );

  const utils = trpc.useUtils();
  const createMutation = trpc.fisherfolk.create.useMutation({
    onSuccess: (record) => {
      toast.success(`Registered ${record.fullName} (${record.idNumber}).`);
      void utils.fisherfolk.list.invalidate();
      router.push(`/${tenantSlug}/fisherfolk`);
      router.refresh();
    },
    onError: (error) => {
      if (error.data?.code === "CONFLICT") {
        toast.error(
          "ID number already exists. Regenerating — please submit again.",
        );
        void idNumberQuery.refetch();
        return;
      }
      toast.error(error.message);
    },
  });

  // Wait for ID number before showing review
  const idNumber = idNumberQuery.data?.idNumber ?? null;
  const registrationYear =
    idNumberQuery.data?.year ?? new Date().getFullYear();

  async function handleNext() {
    const fields = STEP_FIELDS[step as 1 | 2];
    const isValid = await form.trigger(fields, { shouldFocus: true });
    if (isValid) {
      setStep((prev) => (prev === 1 ? 2 : 3));
    }
  }

  function handleBack() {
    setStep((prev) => (prev === 3 ? 2 : 1));
  }

  function handleSubmit(values: FormValues) {
    if (idNumber == null) {
      toast.error("ID number not yet generated. Please wait and try again.");
      return;
    }

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
      idNumber,
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
      categoryIds: [],
      registrationYear,
    });
  }

  const isSubmitting = createMutation.isPending;

  return (
    <Card className="space-y-6 p-6">
      <StepIndicator current={step} />

      <Form {...form}>
        <form
          onSubmit={(event) => {
            void form.handleSubmit(handleSubmit)(event);
          }}
          className="space-y-6"
        >
          {step === 1 && <PersonalStep form={form} />}
          {step === 2 && <AddressStep form={form} />}
          {step === 3 && (
            <ReviewStep
              values={form.getValues()}
              idNumber={idNumber}
              idNumberLoading={idNumberQuery.isLoading}
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
                <Link href={`/${tenantSlug}/fisherfolk`}>Cancel</Link>
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
                  disabled={isSubmitting || idNumber == null}
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
    </Card>
  );
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const labels = ["Personal", "Address", "Review"];
  return (
    <ol className="flex items-center gap-3 text-sm">
      {labels.map((label, idx) => {
        const stepNumber = (idx + 1) as 1 | 2 | 3;
        const isActive = stepNumber === current;
        const isComplete = stepNumber < current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isComplete
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {stepNumber}
            </span>
            <span
              className={
                isActive ? "font-medium text-foreground" : "text-muted-foreground"
              }
            >
              {label}
            </span>
            {idx < labels.length - 1 && (
              <span className="ml-1 h-px w-8 bg-border" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface StepProps {
  form: UseFormReturn<FormValues>;
}

function PersonalStep({ form }: StepProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  );
}

function AddressStep({ form }: StepProps) {
  return (
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
              <Input placeholder="Barangay name" {...field} />
            </FormControl>
            <FormDescription>
              Free text for now — Batch 2b will replace with a tenant-managed
              barangay picker.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

interface ReviewStepProps {
  values: FormValues;
  idNumber: string | null;
  idNumberLoading: boolean;
  registrationYear: number;
}

function ReviewStep({
  values,
  idNumber,
  idNumberLoading,
  registrationYear,
}: ReviewStepProps) {
  const fullName = [
    values.firstName,
    values.middleName,
    values.lastName,
    values.suffix,
  ]
    .filter((part) => part.trim().length > 0)
    .join(" ")
    .trim();

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          Auto-generated ID
        </p>
        <p className="mt-1 font-mono text-lg text-foreground">
          {idNumberLoading ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </span>
          ) : (
            (idNumber ?? "—")
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Registration year: {registrationYear}. Photo, signature, QR, and
          category assignment are added after the basic record is saved.
        </p>
      </section>

      <ReviewGrid
        rows={[
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
          ["Address", values.address],
          ["Barangay", values.barangay],
        ]}
      />
    </div>
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
