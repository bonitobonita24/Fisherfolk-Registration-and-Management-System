"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Fish,
  FileX2,
  HeartHandshake,
  History,
  ImageOff,
  ListChecks,
  Pencil,
  RefreshCw,
  Ship,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { renderQRDataUrl } from "@/lib/qr-code";
import { useTenantHref } from "@/lib/use-tenant-href";
import { FisherfolkActivityTimeline } from "./fisherfolk-activity-timeline";
import { MakeTodoDialog } from "@/components/todo/make-todo-dialog";
import { LinkedTodos } from "@/components/todo/linked-todos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { RecordHeader } from "@/components/shared/record-header";
import { ZoomableImage } from "@/components/shared/zoomable-image";
import { LocationPicker } from "@/components/shared/location-picker";
import { UnderlineTabsList, UnderlineTabsTrigger } from "@/components/shared/underline-tabs";
import {
  DefinitionGrid,
  DetailField,
  FieldRail,
} from "@/components/shared/detail-field";
import { GEAR_TYPE_LABELS } from "@frms/shared/constants";

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

/** Colored category chip — tinted from the category's own displayColor hex. */
function CategoryChip({
  name,
  color,
}: {
  name: string;
  color: string | null | undefined;
}) {
  const hex = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#6b7280";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: `${hex}1a`,
        color: hex,
        borderColor: `${hex}40`,
      }}
    >
      {name}
    </span>
  );
}

export function FisherfolkDetailClient({ id }: Props) {
  const tenantHref = useTenantHref();
  const utils = trpc.useUtils();

  const {
    data: record,
    isLoading,
    isError,
    error,
  } = trpc.fisherfolk.getById.useQuery({ id });

  const { data: me } = trpc.user.me.useQuery();

  const { data: categories } = trpc.category.list.useQuery({});

  const { data: photoUrlResp } = trpc.upload.getDownloadUrl.useQuery(
    { key: record?.photo ?? "" },
    { enabled: !!record?.photo },
  );

  const { data: signatureUrlResp } = trpc.upload.getDownloadUrl.useQuery(
    { key: record?.signature ?? "" },
    { enabled: !!record?.signature },
  );

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!record?.qrCode) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void renderQRDataUrl(record.qrCode).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [record?.qrCode]);

  const renewMutation = trpc.fisherfolk.renew.useMutation();
  const releaseMutation = trpc.fisherfolk.markIdReleased.useMutation();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading fisherfolk…</p>
    );
  }

  if (isError) {
    const notFound = error?.data?.code === "NOT_FOUND";
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={tenantHref("/fisherfolk")}>Back to list</Link>
        </Button>
        <Card className="gap-0 py-5">
          <CardContent className="px-6 py-10 text-center">
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

  const role = me?.role;
  const canAct =
    role === "encoder" ||
    role === "tenant_admin" ||
    role === "tenant_superadmin" ||
    role === "tenant_manager";
  const hasActiveViolation = record.violations.some(
    (v) => v.status === "ACTIVE",
  );
  const isAlreadyReleased = !!record.idReleasedAt;

  const isRenewed = record.renewals.length > 0;
  const latestRenewal = record.renewals[0];

  const handleRenew = async () => {
    try {
      await renewMutation.mutateAsync({ id });
      void utils.fisherfolk.getById.invalidate({ id });
      void utils.fisherfolk.getActivity.invalidate({ id });
      toast.success("Registration renewed successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to renew registration.",
      );
      throw err; // re-throw so ConfirmDialog keeps itself open
    }
  };

  const handleMarkReleased = async () => {
    try {
      await releaseMutation.mutateAsync({ id });
      void utils.fisherfolk.getById.invalidate({ id });
      void utils.fisherfolk.getActivity.invalidate({ id });
      toast.success("ID marked as released.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to mark ID as released.",
      );
      throw err; // re-throw so ConfirmDialog keeps itself open
    }
  };

  const headerActions = (
    <>
      {canAct && (
        <>
          {/* Renew Registration — disabled + tooltip when active violation */}
          {hasActiveViolation ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* span receives pointer/focus events when button is disabled */}
                  <span
                    tabIndex={0}
                    aria-label="Renew registration (blocked: active violation on record)"
                  >
                    <Button variant="outline" size="sm" disabled aria-disabled="true">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Renew
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Cannot renew: fisherfolk has an active violation on record.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm" aria-label="Renew registration">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renew
                </Button>
              }
              title="Renew Registration"
              description={`Renew ${record.fullName}'s fisherfolk registration for the current year. This sets their status to RENEWED.`}
              confirmLabel="Confirm Renewal"
              variant="default"
              onConfirm={handleRenew}
            />
          )}

          {/* Mark ID as Released — hidden once already released */}
          {!isAlreadyReleased && (
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm" aria-label="Mark ID as released">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark ID Released
                </Button>
              }
              title="Mark ID as Released"
              description={`Confirm that ${record.fullName}'s fisherfolk ID card has been physically released to them. This action cannot be undone.`}
              confirmLabel="Confirm Release"
              variant="default"
              onConfirm={handleMarkReleased}
            />
          )}
        </>
      )}

      {canAct && <Separator orientation="vertical" className="mx-0.5 h-6" />}

      <MakeTodoDialog
        sourceEntityType="fisherfolk"
        sourceEntityId={id}
        defaultTitle={`Follow up / missing data: ${record.fullName}`}
      />
      <Button asChild variant="outline" size="sm">
        <Link href={tenantHref(`/fisherfolk/${id}/edit`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Link>
      </Button>
    </>
  );

  return (
    <div className="space-y-4 pb-4">
      <RecordHeader
        backHref={tenantHref("/fisherfolk")}
        backLabel="Back to fisherfolk list"
        title={record.fullName}
        meta={record.idNumber}
        badge={<StatusBadge status={record.status} />}
        actions={headerActions}
      />

      <div className="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        {/* LEFT — fields rail */}
        <FieldRail>
          {/* Media row — photo / signature / QR, compact side-by-side */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Photo</p>
              {record.photo && photoUrlResp?.url ? (
                <ZoomableImage
                  src={photoUrlResp.url}
                  alt={`Portrait of ${record.fullName}`}
                  thumbnailClassName="aspect-square w-full rounded-lg border bg-muted object-cover"
                  ariaLabel="Enlarge photo"
                />
              ) : (
                <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border bg-muted">
                  <ImageOff size={18} className="text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">No image</p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Signature</p>
              {record.signature && signatureUrlResp?.url ? (
                <ZoomableImage
                  src={signatureUrlResp.url}
                  alt={`${record.fullName} signature`}
                  thumbnailClassName="aspect-square w-full rounded-lg border bg-white object-contain"
                  enlargedClassName="max-h-[85vh] max-w-full rounded-lg bg-white object-contain p-4"
                  ariaLabel="Enlarge signature"
                />
              ) : (
                <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border bg-muted">
                  <FileX2 size={18} className="text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">None</p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">QR Code</p>
              {qrDataUrl ? (
                <ZoomableImage
                  src={qrDataUrl}
                  alt={`${record.idNumber} QR code`}
                  thumbnailClassName="aspect-square w-full rounded-lg border bg-white p-1"
                  enlargedClassName="max-h-[85vh] max-w-full rounded-lg bg-white object-contain p-6"
                  ariaLabel="Enlarge QR code"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-lg border bg-muted">
                  <p className="text-[10px] text-muted-foreground">
                    {record.qrCode ? "…" : "No QR"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DetailField label="ID Number" value={record.idNumber} />
          <DetailField label="RSBSA Number" value={record.rsbsaNumber} />
          <DetailField
            label="Category"
            value={
              record.categoryIds.length > 0 ? (
                <span className="flex flex-wrap items-center gap-1.5">
                  {record.categoryIds.map((catId) => {
                    const category = categories?.find((c) => c.id === catId);
                    return (
                      <CategoryChip
                        key={catId}
                        name={category?.name ?? "Unknown"}
                        color={category?.displayColor}
                      />
                    );
                  })}
                </span>
              ) : null
            }
          />
        </FieldRail>

        {/* RIGHT — tabbed related-record sections */}
        <div className="min-w-0">
          <Tabs defaultValue="profile">
            <UnderlineTabsList>
              <UnderlineTabsTrigger value="profile">
                <UserRound className="size-3.5" aria-hidden="true" />
                Profile
              </UnderlineTabsTrigger>
              <UnderlineTabsTrigger value="vessels">
                <Ship className="size-3.5" aria-hidden="true" />
                Vessels
                <Badge variant="outline" className="text-[11px] tabular-nums">
                  {record.vessels.length}
                </Badge>
              </UnderlineTabsTrigger>
              <UnderlineTabsTrigger value="violations">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                Violations
                <Badge variant="outline" className="text-[11px] tabular-nums">
                  {record.violations.length}
                </Badge>
              </UnderlineTabsTrigger>
              <UnderlineTabsTrigger value="ayuda">
                <HeartHandshake className="size-3.5" aria-hidden="true" />
                Ayuda
                <Badge variant="outline" className="text-[11px] tabular-nums">
                  {record.ayudaBeneficiaries.length}
                </Badge>
              </UnderlineTabsTrigger>
              <UnderlineTabsTrigger value="fish-catches">
                <Fish className="size-3.5" aria-hidden="true" />
                Fish Catches
                <Badge variant="outline" className="text-[11px] tabular-nums">
                  {record.fishCatches.length}
                </Badge>
              </UnderlineTabsTrigger>
              <UnderlineTabsTrigger value="renewals">
                <History className="size-3.5" aria-hidden="true" />
                Renewals
                <Badge variant="outline" className="text-[11px] tabular-nums">
                  {record.renewals.length}
                </Badge>
              </UnderlineTabsTrigger>
              <UnderlineTabsTrigger value="activity">
                <Activity className="size-3.5" aria-hidden="true" />
                Activity
              </UnderlineTabsTrigger>
              <UnderlineTabsTrigger value="todos">
                <ListChecks className="size-3.5" aria-hidden="true" />
                ToDos
              </UnderlineTabsTrigger>
            </UnderlineTabsList>

            <TabsContent value="profile" className="min-w-0 pt-4">
              <Card className="gap-0 py-5">
                <CardHeader className="px-6 pb-4 pt-0">
                  <CardTitle className="text-sm font-medium">Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 px-6 py-0">
                  <DefinitionGrid columns={4}>
                    <DetailField label="Last Name" value={record.lastName} />
                    <DetailField label="First Name" value={record.firstName} />
                    <DetailField label="Middle Name" value={record.middleName} />
                    <DetailField label="Suffix" value={record.suffix} />
                  </DefinitionGrid>

                  <Separator />

                  <DefinitionGrid columns={4}>
                    <DetailField
                      label="Date of Birth"
                      value={formatDate(record.dateOfBirth)}
                    />
                    <DetailField label="Sex" value={record.sex} />
                    <DetailField label="Barangay" value={record.barangay} />
                    <DetailField
                      label="Contact Number"
                      value={record.contactNumber}
                    />
                  </DefinitionGrid>

                  <Separator />

                  <DefinitionGrid columns={3}>
                    <DetailField label="Civil Status" value={record.civilStatus} />
                    <DetailField
                      label="Employment Type"
                      value={record.employmentType}
                    />
                    <DetailField
                      label="Primary Source of Income"
                      value={record.primarySourceOfIncome}
                    />
                    <DetailField
                      label="Date Joined"
                      value={formatDate(record.dateJoined)}
                    />
                    <DetailField
                      label="Renewal Date"
                      value={
                        <span className="inline-flex items-center gap-1.5">
                          {formatDate(latestRenewal?.renewedAt)}
                          {record.renewals.length > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-5 shrink-0 text-muted-foreground hover:text-foreground"
                                  aria-label="View renewal history"
                                >
                                  <History className="size-3.5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72" align="start">
                                <p className="mb-2 text-xs font-medium text-foreground">
                                  Renewal History
                                </p>
                                <ul className="max-h-64 space-y-2 overflow-y-auto">
                                  {record.renewals.map((r) => (
                                    <li key={r.id} className="text-xs">
                                      <p className="font-medium text-foreground">
                                        {r.renewalYear}
                                      </p>
                                      <p className="text-muted-foreground">
                                        {formatDate(r.renewedAt)}
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              </PopoverContent>
                            </Popover>
                          )}
                        </span>
                      }
                    />
                    <DetailField
                      label="Renewal Status"
                      value={
                        <span className="inline-flex items-center gap-1.5">
                          <StatusBadge
                            status={isRenewed ? "RENEWED" : "NEW"}
                            color={isRenewed ? "orange" : "green"}
                            icon={isRenewed ? RefreshCw : Sparkles}
                          />
                          <span className="text-xs text-muted-foreground">
                            {isRenewed
                              ? `Last renewed ${formatDate(latestRenewal?.renewedAt)}`
                              : "New registration"}
                          </span>
                        </span>
                      }
                    />
                    <DetailField
                      label="Household"
                      value={
                        record.household ? (
                          <Link
                            href={tenantHref(`/households/${record.household.id}`)}
                            className="inline-flex items-center gap-2 font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {record.household.householdNumber}
                            {record.family ? (
                              <Badge variant="outline">
                                {record.family.familyNumber}
                              </Badge>
                            ) : null}
                            <Badge variant="secondary">
                              {(
                                record.family
                                  ? record.family.headId === record.id
                                  : record.household.headId === record.id
                              )
                                ? "Family Head"
                                : "Member"}
                            </Badge>
                          </Link>
                        ) : (
                          "No household"
                        )
                      }
                    />
                    <DetailField
                      label="ID Release Status"
                      value={
                        isAlreadyReleased ? (
                          <span className="inline-flex items-center gap-2">
                            <CheckCircle
                              className="h-4 w-4 shrink-0 text-green-600"
                              aria-hidden="true"
                            />
                            <span>
                              Released {formatDate(record.idReleasedAt)}
                              {record.idReleasedBy
                                ? ` by ${record.idReleasedBy.name ?? record.idReleasedBy.email}`
                                : ""}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <Clock
                              className="h-4 w-4 shrink-0"
                              aria-hidden="true"
                            />
                            Not yet released
                          </span>
                        )
                      }
                    />
                    <DetailField
                      label="Remarks"
                      value={record.remarks}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                  </DefinitionGrid>

                  <Separator />

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Location
                    </p>
                    {record.latitude != null && record.longitude != null ? (
                      <LocationPicker
                        disabled
                        value={{ lat: record.latitude, lng: record.longitude }}
                        onChange={() => {}}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No location set
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vessels" className="min-w-0 pt-4">
              <Card className="gap-0 py-5">
                <CardHeader className="px-6 pb-4 pt-0">
                  <CardTitle className="text-sm font-medium">
                    Registered Vessels
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-0">
                  {record.vessels.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No registered vessels.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {record.vessels.map((v) => (
                        <li
                          key={v.id}
                          className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <Link
                              href={tenantHref(`/vessels/${v.id}`)}
                              className="text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {v.vesselName}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {v.mfvrNumber} &middot; {v.vesselType}
                            </p>
                          </div>
                          <StatusBadge status={v.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="violations" className="min-w-0 pt-4">
              <Card className="gap-0 py-5">
                <CardHeader className="px-6 pb-4 pt-0">
                  <CardTitle className="text-sm font-medium">
                    Latest Violations
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-0">
                  {record.violations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No violations on record.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {record.violations.map((v) => (
                        <li
                          key={v.id}
                          className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <Link
                              href={tenantHref(`/violations/${v.id}`)}
                              className="text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {v.subject}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(v.createdAt)}
                            </p>
                          </div>
                          <StatusBadge
                            status={v.status}
                            color={v.status === "ACTIVE" ? "red" : "green"}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ayuda" className="min-w-0 pt-4">
              <Card className="gap-0 py-5">
                <CardHeader className="px-6 pb-4 pt-0">
                  <CardTitle className="text-sm font-medium">
                    Ayuda Received
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-0">
                  {record.ayudaBeneficiaries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No ayuda programs.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {record.ayudaBeneficiaries.map((b) => (
                        <li
                          key={b.id}
                          className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <Link
                              href={tenantHref(`/ayuda/${b.program.id}`)}
                              className="text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {b.program.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {b.verifiedAt
                                ? `Received ${formatDate(b.verifiedAt)}`
                                : `Added ${formatDate(b.createdAt)}`}
                            </p>
                          </div>
                          <StatusBadge status={b.verificationStatus} />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fish-catches" className="min-w-0 pt-4">
              <Card className="gap-0 py-5">
                <CardHeader className="px-6 pb-4 pt-0">
                  <CardTitle className="text-sm font-medium">
                    Fish Catches
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-0">
                  {record.fishCatches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No fish catches on record.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {record.fishCatches.map((fc) => (
                        <li
                          key={fc.id}
                          className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <Link
                              href={tenantHref(`/fish-catches/${fc.id}`)}
                              className="text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {fc.referenceNo}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {new Date(fc.landingDate).toLocaleDateString("en-PH")}{" "}
                              &middot; {GEAR_TYPE_LABELS[fc.gearType]}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm text-muted-foreground">
                            {fc.totalCatchKg.toLocaleString()} kg
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="renewals" className="min-w-0 pt-4">
              <Card className="gap-0 py-5">
                <CardHeader className="px-6 pb-4 pt-0">
                  <CardTitle className="text-sm font-medium">
                    Renewal History
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-0">
                  {record.renewals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No renewals yet.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border" aria-label="Renewal history">
                      {record.renewals.map((r) => (
                        <li key={r.id} className="space-y-0.5 py-3 first:pt-0 last:pb-0">
                          <p className="text-sm font-medium text-foreground">
                            {r.renewalYear}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(r.renewedAt)} &middot;{" "}
                            {r.renewedBy?.name ?? r.renewedBy?.email ?? "Unknown staff"}
                            {r.notes ? ` · ${r.notes}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="min-w-0 pt-4">
              <FisherfolkActivityTimeline id={id} />
            </TabsContent>

            <TabsContent value="todos" className="min-w-0 pt-4">
              <LinkedTodos sourceEntityType="fisherfolk" sourceEntityId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
