"use client";

import { useMemo, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState, ListToolbar, ListPagination, DefinitionGrid, DetailField } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { buildColumns } from "./columns";

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "REQUEST",
  "APPROVE",
  "REJECT",
  "RENEW",
  "PRINT",
  "VIOLATION_FILED",
  "VIOLATION_LIFTED",
  "LOGIN",
  "EXPORT",
  "MEDIA_DOWNLOAD",
  "EXPIRE",
] as const;

type AuditAction = (typeof ACTIONS)[number];

const PAGE_SIZES = [20, 50, 100] as const;

function toDateOrUndefined(value: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

function JsonSnapshot({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[0.95rem] text-muted-foreground">{label}</p>
      <pre className="max-h-64 overflow-auto rounded-md border border-border bg-muted/50 p-3 text-xs [overflow-wrap:anywhere] whitespace-pre-wrap">
        {value == null ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function AuditLogDetailDialog({
  id,
  onOpenChange,
}: {
  id: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = trpc.auditLog.getById.useQuery(
    { id: id ?? "" },
    { enabled: !!id },
  );

  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Audit Log Entry</DialogTitle>
          <DialogDescription>
            Full details of this recorded action, including before/after snapshots.
          </DialogDescription>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {data && (
          <div className="space-y-4">
            <DefinitionGrid columns={2}>
              <DetailField label="Action" value={data.action.replace(/_/g, " ")} />
              <DetailField label="Entity" value={`${data.entityType} #${data.entityId}`} />
              <DetailField label="User" value={data.user?.name ?? "—"} />
              <DetailField
                label="Timestamp"
                value={new Date(data.createdAt).toLocaleString("en-PH")}
              />
            </DefinitionGrid>
            <JsonSnapshot label="Before" value={data.before} />
            <JsonSnapshot label="After" value={data.after} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AuditLogListClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(50);
  const [action, setAction] = useState<AuditAction | undefined>(undefined);
  const [entityType, setEntityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);

  const { data } = trpc.auditLog.list.useQuery(
    {
      page,
      limit,
      action,
      entityType: entityType || undefined,
      dateFrom: toDateOrUndefined(dateFrom),
      dateTo: toDateOrUndefined(dateTo),
    },
    { placeholderData: keepPreviousData },
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;
  const columns = useMemo(() => buildColumns({ onView: setViewId }), []);

  const handleActionChange = (value: string) => {
    setAction(value === "ALL" ? undefined : (value as AuditAction));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <ListToolbar>
        <div className="flex items-center gap-2">
          <ScrollText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">All Entries</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {data ? data.total : "-"}
          </span>
        </div>
        <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
          <Select value={action ?? "ALL"} onValueChange={handleActionChange}>
            <SelectTrigger className="h-8 w-full sm:w-[160px]" aria-label="Filter by action">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent className="w-52">
              <SelectItem value="ALL">All Actions</SelectItem>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            placeholder="Entity type..."
            className="h-8 w-full sm:w-40"
            aria-label="Filter by entity type"
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="audit-date-from" className="sr-only">
              From date
            </Label>
            <Input
              id="audit-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="h-8 w-full sm:w-36"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="audit-date-to" className="sr-only">
              To date
            </Label>
            <Input
              id="audit-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="h-8 w-full sm:w-36"
            />
          </div>
        </div>
      </ListToolbar>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        pageSize={limit}
        showPagination={false}
        emptyState={
          <EmptyState
            icon={ScrollText}
            title="No audit entries found"
            description="Try adjusting your filters."
          />
        }
      />

      <ListPagination
        page={page}
        pageSize={limit}
        pageSizeOptions={PAGE_SIZES}
        pageCount={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setLimit(size);
          setPage(1);
        }}
        summary={
          data
            ? `${data.total} record${data.total !== 1 ? "s" : ""} found`
            : "Loading..."
        }
      />

      <AuditLogDetailDialog id={viewId} onOpenChange={(open) => !open && setViewId(null)} />
    </div>
  );
}
