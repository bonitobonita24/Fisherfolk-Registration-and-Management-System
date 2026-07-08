"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection, FormActions } from "@/components/shared";
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

const formSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(255),
    description: z.string(),
    distributionUnit: z.enum(["FISHERFOLK", "HOUSEHOLD"]),
  })
  .strict();

type FormValues = z.infer<typeof formSchema>;

/** Return trimmed string or undefined when blank. */
function trimOpt(v: string): string | undefined {
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

export function AyudaFormClient() {
  const router = useRouter();
  const params = useParams<{ tenant: string }>();
  const tenantSlug = params.tenant;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      distributionUnit: "FISHERFOLK",
    },
  });

  const utils = trpc.useUtils();

  const createMutation = trpc.ayuda.createProgram.useMutation({
    onSuccess: (record) => {
      toast.success("Program created as draft.");
      void utils.ayuda.listPrograms.invalidate();
      router.push(`/${tenantSlug}/ayuda/${record.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function handleSubmit(values: FormValues) {
    createMutation.mutate({
      title: values.title.trim(),
      description: trimOpt(values.description),
      distributionUnit: values.distributionUnit,
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
        <FormSection title="Program Details">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Fuel Subsidy Q3 2026"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="Describe the assistance program…"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The program starts as a draft. Publish it to begin adding
                  beneficiaries.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="distributionUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distribution</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select distribution unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FISHERFOLK">Per fisherfolk</SelectItem>
                    <SelectItem value="HOUSEHOLD">Per household</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Per household enrolls one member (the household head) on
                  behalf of the whole household.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormActions>
          <Button type="button" variant="outline" asChild>
            <Link href={`/${tenantSlug}/ayuda`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Program
          </Button>
        </FormActions>
      </form>
    </Form>
  );
}
