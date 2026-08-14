"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

import { FormSection, FormActions } from "@/components/shared";
import { RegistrationFormClient } from "./registration-form-client";

const searchSchema = z
  .object({
    idNumber: z.string().trim(),
    rsbsaNumber: z.string().trim(),
    firstName: z.string().trim(),
    lastName: z.string().trim(),
    dateOfBirth: z.string().trim(),
  })
  .refine(
    (data) =>
      data.idNumber.length > 0 ||
      data.rsbsaNumber.length > 0 ||
      (data.firstName.length > 0 && data.lastName.length > 0),
    {
      message:
        "Enter an ID number, RSBSA number, or both first and last name to search.",
      path: ["firstName"],
    },
  )
  .refine(
    (data) => data.dateOfBirth.length === 0 || !Number.isNaN(Date.parse(data.dateOfBirth)),
    { message: "Invalid date", path: ["dateOfBirth"] },
  );

type SearchValues = z.infer<typeof searchSchema>;

type MatchType =
  | "EXACT_ID"
  | "EXACT_RSBSA"
  | "STRONG_NAME_DOB"
  | "POSSIBLE_NAME";

interface MatchCandidate {
  id: string;
  idNumber: string;
  rsbsaNumber: string | null;
  fullName: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  suffix: string | null;
  dateOfBirth: Date | null;
  barangay: string;
  contactNumber: string | null;
  status: string;
  createdAt: Date;
  matchType: MatchType;
}

interface SearchOutcome {
  matches: MatchCandidate[];
  query: SearchValues;
}

export function DuplicateSearchClient() {
  const params = useParams<{ tenant: string }>();
  const tenantSlug = params.tenant;
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [proceedValues, setProceedValues] =
    useState<Partial<SearchValues> | null>(null);

  const utils = trpc.useUtils();

  const form = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      idNumber: "",
      rsbsaNumber: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
    },
  });

  async function handleSearch(values: SearchValues) {
    setIsSearching(true);
    try {
      const input: Parameters<
        typeof utils.fisherfolk.searchForDuplicates.fetch
      >[0] = {};
      if (values.idNumber.length > 0) input.idNumber = values.idNumber;
      if (values.rsbsaNumber.length > 0) input.rsbsaNumber = values.rsbsaNumber;
      if (values.firstName.length > 0) input.firstName = values.firstName;
      if (values.lastName.length > 0) input.lastName = values.lastName;
      if (values.dateOfBirth.length > 0) {
        input.dateOfBirth = new Date(values.dateOfBirth);
      }

      const result = await utils.fisherfolk.searchForDuplicates.fetch(input);
      setOutcome({
        matches: result.matches,
        query: values,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Search failed. Try again.";
      toast.error(message);
    } finally {
      setIsSearching(false);
    }
  }

  function handleProceed() {
    if (outcome == null) return;
    setProceedValues(outcome.query);
  }

  function handleSearchAgain() {
    setOutcome(null);
    form.reset();
  }

  if (proceedValues != null) {
    return (
      <RegistrationFormClient
        initialValues={{
          firstName: proceedValues.firstName ?? "",
          lastName: proceedValues.lastName ?? "",
          dateOfBirth: proceedValues.dateOfBirth ?? "",
          rsbsaNumber: proceedValues.rsbsaNumber ?? "",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <FormSection
        title="Check for existing registration"
        description="Search before registering to prevent duplicates. Enter any ID, RSBSA number, or full name to scan active records."
      >
        <Form {...form}>
          <form
            onSubmit={(event) => {
              void form.handleSubmit(handleSearch)(event);
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID number</FormLabel>
                    <FormControl>
                      <Input placeholder="FF-2026-0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rsbsaNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RSBSA number</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
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
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Dela Cruz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Date of birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional. Strengthens name matches when provided.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormActions>
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search for duplicates
              </Button>
            </FormActions>
          </form>
        </Form>
      </FormSection>

      {outcome != null && (
        <ResultsPanel
          outcome={outcome}
          tenantSlug={tenantSlug}
          onProceed={handleProceed}
          onSearchAgain={handleSearchAgain}
        />
      )}
    </div>
  );
}

interface ResultsPanelProps {
  outcome: SearchOutcome;
  tenantSlug: string;
  onProceed: () => void;
  onSearchAgain: () => void;
}

function ResultsPanel({
  outcome,
  tenantSlug,
  onProceed,
  onSearchAgain,
}: ResultsPanelProps) {
  const { matches } = outcome;

  if (matches.length === 0) {
    return (
      <Card className="border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20">
        <CardContent className="space-y-4 px-6 py-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              No matching records found
            </h3>
            <p className="text-xs text-muted-foreground">
              No active fisherfolk in this tenant match the search criteria.
              You can safely proceed to register a new record.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-emerald-500/30 pt-4">
          <Button variant="outline" onClick={onSearchAgain}>
            Search again
          </Button>
          <Button onClick={onProceed}>
            Proceed to register
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        </CardContent>
      </Card>
    );
  }

  const hasExact = matches.some(
    (m) => m.matchType === "EXACT_ID" || m.matchType === "EXACT_RSBSA",
  );

  return (
    <Card
      className={
        hasExact
          ? "border-destructive/40 bg-destructive/5"
          : "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20"
      }
    >
      <CardContent className="space-y-4 px-6 py-5">
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
            hasExact ? "text-destructive" : "text-amber-500"
          }`}
        />
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-foreground">
            {matches.length} possible {matches.length === 1 ? "match" : "matches"}{" "}
            found
          </h3>
          <p className="text-xs text-muted-foreground">
            Review the records below before creating a duplicate. If this is a
            genuinely different person, you may proceed.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {matches.map((match) => (
          <li key={match.id}>
            <MatchCard match={match} tenantSlug={tenantSlug} />
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="outline" onClick={onSearchAgain}>
          Search again
        </Button>
        <Button variant={hasExact ? "destructive" : "default"} onClick={onProceed}>
          Proceed anyway — different person
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      </CardContent>
    </Card>
  );
}

const MATCH_LABEL: Record<MatchType, string> = {
  EXACT_ID: "Exact ID match",
  EXACT_RSBSA: "Exact RSBSA match",
  STRONG_NAME_DOB: "Same name & DOB",
  POSSIBLE_NAME: "Similar name",
};

function matchBadgeClass(matchType: MatchType): string {
  switch (matchType) {
    case "EXACT_ID":
    case "EXACT_RSBSA":
      return "rounded-full border-transparent bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive dark:bg-destructive/20";
    case "STRONG_NAME_DOB":
      return "rounded-full border-transparent bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400";
    case "POSSIBLE_NAME":
      return "rounded-full border-transparent bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400";
  }
}

function MatchCard({
  match,
  tenantSlug,
}: {
  match: MatchCandidate;
  tenantSlug: string;
}) {
  const dob = match.dateOfBirth
    ? new Date(match.dateOfBirth).toLocaleDateString()
    : "—";

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{match.fullName}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {match.idNumber}
            {match.rsbsaNumber != null && match.rsbsaNumber.length > 0 && (
              <span> · RSBSA {match.rsbsaNumber}</span>
            )}
          </p>
        </div>
        <Badge variant="outline" className={matchBadgeClass(match.matchType)}>
          {MATCH_LABEL[match.matchType]}
        </Badge>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs md:grid-cols-3">
        <Field label="Date of birth" value={dob} />
        <Field label="Barangay" value={match.barangay} />
        <Field label="Status" value={match.status} />
        {match.contactNumber != null && match.contactNumber.length > 0 && (
          <Field label="Contact" value={match.contactNumber} />
        )}
      </dl>

      <div className="mt-3 flex justify-end">
        <Link
          href={`/${tenantSlug}/fisherfolk/${match.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View existing record
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
