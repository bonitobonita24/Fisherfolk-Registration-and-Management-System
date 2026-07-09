"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsClient } from "./analytics-client";
import { FishCatchCompositionClient } from "./fish-catch-composition-client";
import { FishCatchTrendsClient } from "./fish-catch-trends-client";

export function AnalyticsTabs() {
  return (
    <Tabs defaultValue="fisherfolk" className="mt-4">
      <TabsList>
        <TabsTrigger value="fisherfolk">Fisherfolk</TabsTrigger>
        <TabsTrigger value="fish-catch">Fish Catch</TabsTrigger>
      </TabsList>
      <TabsContent value="fisherfolk">
        <AnalyticsClient />
      </TabsContent>
      <TabsContent value="fish-catch">
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Fish Catch Analytics</h2>
          <FishCatchTrendsClient />
          <FishCatchCompositionClient />
        </div>
      </TabsContent>
    </Tabs>
  );
}
