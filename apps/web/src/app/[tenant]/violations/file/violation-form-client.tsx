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
import {
  AttachmentUpload,
  type UploadedAttachment,
} from "@/components/shared/attachment-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const formSchema = z
  .object({
    targetType: z.enum(["FISHERFOLK", "VESSEL", "BOTH"]),
    subject: z.string().min(1, "Subject is required"),
    details: z.string(),
    notes: z.string(),
  })
  .strict();

type FormValues = z.infer<typeof formSchema>;

interface SelectedFisherfolk {
  id: string;
  fullName: string;
  idNumber: string;
}

interface SelectedVessel {
  id: string;
  mfvrNumber: string;
  vesselName: string | null;
}

/** Return trimmed string or undefined when blank. */
function trimOpt(v: string): string | undefined {
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

export function ViolationFormClient() {
  const router = useRouter();
  const params = useParams<{ tenant: string }>();
  const tenantSlug = params.tenant;

  const [violatorMode, setViolatorMode] = useState<"registered" | "name">(
    "registered",
  );
  const [violatorName, setViolatorName] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [fisherfolkSearch, setFisherfolkSearch] = useState("");
  const [selectedFisherfolk, setSelectedFisherfolk] =
    useState<SelectedFisherfolk | null>(null);
  const [vesselSearch, setVesselSearch] = useState("");
  const [selectedVessel, setSelectedVessel] = useState<SelectedVessel | null>(
    null,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetType: "FISHERFOLK",
      subject: "",
      details: "",
      notes: "",
    },
  });

  const targetType = form.watch("targetType");
  const needsFisherfolk = targetType === "FISHERFOLK" || targetType === "BOTH";
  const needsVessel = targetType === "VESSEL" || targetType === "BOTH";

  const utils = trpc.useUtils();

  const createMutation = trpc.violation.create.useMutation({
    onSuccess: (record) => {
      toast.success("Violation filed.");
      void utils.violation.list.invalidate();
      router.push(`/${tenantSlug}/violations/${record.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const fisherfolkListQuery = trpc.fisherfolk.list.useQuery(
    { search: fisherfolkSearch, limit: 10 },
    { enabled: fisherfolkSearch.trim().length >= 2 },
  );

  const vesselListQuery = trpc.vessel.list.useQuery(
    { search: vesselSearch, limit: 10 },
    { enabled: vesselSearch.trim().length >= 2 },
  );

  function handleSubmit(values: FormValues) {
    if (needsFisherfolk) {
      if (violatorMode === "registered" && !selectedFisherfolk) {
        toast.error("Select a fisherfolk for this violation.");
        return;
      }
      if (violatorMode === "name" && !violatorName.trim()) {
        toast.error("Enter the violator's name.");
        return;
      }
    }
    if (needsVessel && !selectedVessel) {
      toast.error("Select a vessel for this violation.");
      return;
    }

    createMutation.mutate({
      targetType: values.targetType,
      subject: values.subject.trim(),
      details: trimOpt(values.details),
      notes: trimOpt(values.notes),
      ...(needsFisherfolk &&
        violatorMode === "registered" &&
        selectedFisherfolk && { fisherfolkId: selectedFisherfolk.id }),
      ...(needsFisherfolk &&
        violatorMode === "name" && {
          violatorName: violatorName.trim(),
        }),
      ...(needsVessel && selectedVessel && { vesselId: selectedVessel.id }),
      attachments,
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
        {/* Target */}
        <Card className="space-y-4 p-6">
          <h2 className="text-base font-semibold text-foreground">Target</h2>
          <FormField
            control={form.control}
            name="targetType"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Target Type *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FISHERFOLK">Fisherfolk</SelectItem>
                    <SelectItem value="VESSEL">Vessel</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Who or what this violation is filed against.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {needsFisherfolk && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Fisherfolk *
              </p>
              {/* Mode toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={violatorMode === "registered" ? "default" : "outline"}
                  onClick={() => {
                    setViolatorMode("registered");
                    setViolatorName("");
                  }}
                >
                  Registered fisherfolk
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={violatorMode === "name" ? "default" : "outline"}
                  onClick={() => {
                    setViolatorMode("name");
                    setSelectedFisherfolk(null);
                    setFisherfolkSearch("");
                  }}
                >
                  Name only (not in system)
                </Button>
              </div>
              {violatorMode === "name" ? (
                <Input
                  value={violatorName}
                  onChange={(e) => setViolatorName(e.target.value)}
                  placeholder="Full name of violator"
                />
              ) : selectedFisherfolk ? (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1 pr-1">
                    <span>{selectedFisherfolk.fullName}</span>
                    <span className="font-mono text-xs opacity-70">
                      {selectedFisherfolk.idNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFisherfolk(null)}
                      className="ml-1 rounded hover:bg-muted"
                      aria-label="Remove fisherfolk"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              ) : (
                <>
                  <Input
                    value={fisherfolkSearch}
                    onChange={(e) => setFisherfolkSearch(e.target.value)}
                    placeholder="Search fisherfolk by name or ID number…"
                  />
                  <p className="text-xs text-muted-foreground">
                    Type at least 2 characters to search.
                  </p>
                  {fisherfolkSearch.trim().length >= 2 && (
                    <div className="rounded-md border border-border bg-card">
                      {fisherfolkListQuery.isLoading && (
                        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching…
                        </div>
                      )}
                      {!fisherfolkListQuery.isLoading &&
                        (fisherfolkListQuery.data?.items.length ?? 0) === 0 && (
                          <p className="p-3 text-sm text-muted-foreground">
                            No fisherfolk found for &ldquo;{fisherfolkSearch}
                            &rdquo;.
                          </p>
                        )}
                      {(fisherfolkListQuery.data?.items ?? []).map((ff) => (
                        <button
                          key={ff.id}
                          type="button"
                          onClick={() => {
                            setSelectedFisherfolk({
                              id: ff.id,
                              fullName: ff.fullName,
                              idNumber: ff.idNumber,
                            });
                            setFisherfolkSearch("");
                          }}
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
            </div>
          )}

          {needsVessel && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Vessel *</p>
              {selectedVessel ? (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1 pr-1">
                    <span>
                      {selectedVessel.vesselName ?? selectedVessel.mfvrNumber}
                    </span>
                    <span className="font-mono text-xs opacity-70">
                      {selectedVessel.mfvrNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedVessel(null)}
                      className="ml-1 rounded hover:bg-muted"
                      aria-label="Remove vessel"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              ) : (
                <>
                  <Input
                    value={vesselSearch}
                    onChange={(e) => setVesselSearch(e.target.value)}
                    placeholder="Search vessel by MFVR number or name…"
                  />
                  <p className="text-xs text-muted-foreground">
                    Type at least 2 characters to search.
                  </p>
                  {vesselSearch.trim().length >= 2 && (
                    <div className="rounded-md border border-border bg-card">
                      {vesselListQuery.isLoading && (
                        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching…
                        </div>
                      )}
                      {!vesselListQuery.isLoading &&
                        (vesselListQuery.data?.items.length ?? 0) === 0 && (
                          <p className="p-3 text-sm text-muted-foreground">
                            No vessels found for &ldquo;{vesselSearch}&rdquo;.
                          </p>
                        )}
                      {(vesselListQuery.data?.items ?? []).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedVessel({
                              id: v.id,
                              mfvrNumber: v.mfvrNumber,
                              vesselName: v.vesselName,
                            });
                            setVesselSearch("");
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <span className="font-medium text-foreground">
                            {v.vesselName ?? "—"}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {v.mfvrNumber}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Card>

        {/* Details */}
        <Card className="space-y-4 p-6">
          <h2 className="text-base font-semibold text-foreground">Details</h2>
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Fishing in a closed season"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="Describe the violation…"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Internal Notes</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Optional notes for staff…"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Evidence */}
        <Card className="space-y-4 p-6">
          <h2 className="text-base font-semibold text-foreground">Evidence</h2>
          <div className="space-y-2">
            <FormLabel>
              Evidence — photos or PDF (optional, max 15MB each)
            </FormLabel>
            <AttachmentUpload
              entityType="violation-evidence"
              value={attachments}
              onChange={setAttachments}
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
          <Button type="button" variant="outline" asChild>
            <Link href={`/${tenantSlug}/violations`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            File Violation
          </Button>
        </div>
      </form>
    </Form>
  );
}
