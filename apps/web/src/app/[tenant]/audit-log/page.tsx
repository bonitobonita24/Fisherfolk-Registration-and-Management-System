export default function AuditLogPage() {
  return (
    <div className="space-y-4">
      <div className="flex shrink-0 items-center gap-3 pb-4 pt-4">
        <h1 className="truncate text-base font-semibold tracking-tight">
          Audit Log
        </h1>
      </div>
      <p className="text-xs text-muted-foreground">
        View immutable audit trail of all system actions and data changes.
      </p>
    </div>
  );
}
