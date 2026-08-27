import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <Card className={cn("rounded-xl border-border bg-card", className)}>
      <CardHeader className="border-b border-border bg-muted/30 px-6 py-5">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-5">{children}</CardContent>
    </Card>
  );
}
