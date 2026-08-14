"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsClient } from "./analytics-client";
import { FishCatchCompositionClient } from "./fish-catch-composition-client";
import { FishCatchTrendsClient } from "./fish-catch-trends-client";

export function AnalyticsTabs() {
  return (
    <Tabs defaultValue="fisherfolk" className="mt-4">
      <TabsList className="h-10 w-full shrink-0 justify-start overflow-x-auto rounded-none border-b px-2 pb-1">
        <TabsTrigger value="fisherfolk" className="shrink-0">
          Fisherfolk
        </TabsTrigger>
        <TabsTrigger value="fish-catch" className="shrink-0">
          Fish Catch
        </TabsTrigger>
      </TabsList>
      <TabsContent value="fisherfolk" className="min-w-0 pt-4 pb-4">
        <AnalyticsClient />
      </TabsContent>
      <TabsContent value="fish-catch" className="min-w-0 pt-4 pb-4">
        <div className="space-y-6">
          <h2 className="text-sm font-medium">Fish Catch Analytics</h2>
          <FishCatchTrendsClient />
          <FishCatchCompositionClient />
        </div>
      </TabsContent>
    </Tabs>
  );
}
