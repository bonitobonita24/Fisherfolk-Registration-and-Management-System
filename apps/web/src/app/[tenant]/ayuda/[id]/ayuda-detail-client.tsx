"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";

interface Props {
  id: string;
}

function formatDate(value: Date | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">
        {value === null || value === undefined || value === "" ? "—" : value}
      </p>
    </div>
  );
}

function BeneficiariesTable({ programId }: { programId: string }) {
  const params = useParams<{ tenant: string }>();
  const { data, isLoading } = trpc.ayuda.listBeneficiaries.useQuery({
    programId,
    page: 1,
    limit: 200,
  });

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading beneficiaries…</p>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No beneficiaries yet.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fisherfolk</TableHead>
          <TableHead>ID Number</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Verified By</TableHead>
          <TableHead>Verified At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((b) => (
          <TableRow key={b.id}>
            <TableCell className="font-medium">
              {b.fisherfolk ? (
                <Link
                  href={`/${params.tenant}/fisherfolk/${b.fisherfolk.id}`}
                  className="text-primary hover:underline"
                >
                  {b.fisherfolk.fullName}
                </Link>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell>{b.fisherfolk?.idNumber ?? "—"}</TableCell>
            <TableCell>
              <StatusBadge status={b.verificationStatus} />
            </TableCell>
            <TableCell>{b.verifiedBy?.name ?? "—"}</TableCell>
            <TableCell>{formatDate(b.verifiedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AyudaDetailClient({ id }: Props) {
  const params = useParams<{ tenant: string }>();

  const {
    data: record,
    isLoading,
    isError,
    error,
  } = trpc.ayuda.getProgramById.useQuery({ id });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading program…</p>;
  }

  if (isError) {
    const notFound = error?.data?.code === "NOT_FOUND";
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${params.tenant}/ayuda`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {notFound ? "Program not found." : "Failed to load program."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${params.tenant}/ayuda`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {record.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(record.createdAt)}
            </p>
          </div>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Title" value={record.title} />
              <Field label="Description" value={record.description} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Beneficiaries</CardTitle>
            </CardHeader>
            <CardContent>
              <BeneficiariesTable programId={record.id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Status" value={record.status} />
              <Field
                label="Beneficiaries"
                value={record.beneficiaryCount.toLocaleString()}
              />
              <Field label="Created By" value={record.createdBy?.name} />
              <Field label="Date Created" value={formatDate(record.createdAt)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
