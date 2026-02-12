import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes — keeps data fresh while avoiding excessive refetches
      gcTime: 1000 * 60 * 60 * 2,      // 2 hours — garbage collect unused cache entries
      refetchOnWindowFocus: false,
      refetchOnMount: true,             // Re-fetch stale data when components mount (critical for navigation)
      retry: 3,                         // Retry failed requests 3 times (handles server startup latency)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff: 1s, 2s, 4s
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <App />
    </TooltipProvider>
  </QueryClientProvider>
);
