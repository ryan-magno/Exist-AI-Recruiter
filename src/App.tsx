import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import UploadPage from "./pages/UploadPage";
import DashboardPage from "./pages/DashboardPage";
import CreateJOPage from "./pages/CreateJOPage";
import ArchivePage from "./pages/ArchivePage";
import CandidatesPage from "./pages/CandidatesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatbotPage from "./pages/ChatbotPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create-jo" element={<CreateJOPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/candidates" element={<CandidatesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
