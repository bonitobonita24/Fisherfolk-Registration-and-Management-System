"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  httpBatchLink,
  loggerLink,
  type TRPCLink,
} from "@trpc/client";
import superjson from "superjson";

import type { AppRouter } from "@/server/trpc/root";
import { trpc } from "./client";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:44387";
}

function makeLinks(): TRPCLink<AppRouter>[] {
  const links: TRPCLink<AppRouter>[] = [];

  if (process.env.NODE_ENV === "development") {
    links.push(
      loggerLink({
        enabled: (op) =>
          op.direction === "down" && op.result instanceof Error,
      }),
    );
  }

  links.push(
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  );

  return links;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: makeLinks(),
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
