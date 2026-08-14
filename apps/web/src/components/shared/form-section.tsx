import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <Card className={className}>
      <CardHeader className="border-b px-6 py-5">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-5">{children}</CardContent>
    </Card>
  );
}
