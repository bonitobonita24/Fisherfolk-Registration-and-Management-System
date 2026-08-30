"use client";

import {
  Tabs,
  TabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "@/components/shared/underline-tabs";
import { AnalyticsClient } from "./analytics-client";
import { FishCatchCompositionClient } from "./fish-catch-composition-client";
import { FishCatchTrendsClient } from "./fish-catch-trends-client";

export function AnalyticsTabs() {
  return (
    <Tabs defaultValue="fisherfolk" className="mt-4">
      <UnderlineTabsList>
        <UnderlineTabsTrigger value="fisherfolk">
          Fisherfolk
        </UnderlineTabsTrigger>
        <UnderlineTabsTrigger value="fish-catch">
          Fish Catch
        </UnderlineTabsTrigger>
      </UnderlineTabsList>
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
