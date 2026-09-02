import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ViolationsGroupTileProps {
  activeViolations: number;
  loading: boolean;
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export function ViolationsGroupTile({
  activeViolations,
  loading,
}: ViolationsGroupTileProps) {
  return (
    <Card className="flex flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="space-y-1 border-b px-6 py-5">
        <CardTitle className="text-sm font-medium">Number of Violations</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center px-6 py-5">
        {loading ? (
          <Shimmer className="h-8 w-12" />
        ) : (
          <p className="text-3xl font-bold leading-none text-foreground">
            {activeViolations.toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
