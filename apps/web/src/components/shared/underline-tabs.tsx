"use client";

import * as React from "react";
import type * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Underline-style tabs — shared visual treatment extracted from the
 * fisherfolk-detail page. Wraps the base shadcn/Radix Tabs primitives with
 * the horizontal-scroll + bottom-border underline classes so any detail
 * page can reuse the exact same look.
 */

const UnderlineTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsList
    ref={ref}
    className={cn(
      "tabs-scrollbar h-10 w-full shrink-0 justify-start overflow-x-auto rounded-none border-b bg-transparent p-0",
      className
    )}
    {...props}
  />
));
UnderlineTabsList.displayName = "UnderlineTabsList";

const UnderlineTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsTrigger
    ref={ref}
    className={cn(
      "shrink-0 gap-1.5 rounded-none border-b-2 border-transparent -mb-px text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:font-semibold",
      className
    )}
    {...props}
  />
));
UnderlineTabsTrigger.displayName = "UnderlineTabsTrigger";

export { Tabs, TabsContent, UnderlineTabsList, UnderlineTabsTrigger };
