import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import UploadPage from "./pages/UploadPage";
import DashboardPage from "./pages/DashboardPage";
import CreateJOPage from "./pages/CreateJOPage";
import ArchivePage from "./pages/ArchivePage";
import CandidatesPage from "./pages/CandidatesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatbotPage from "./pages/ChatbotPage";
import HistoryPage from "./pages/HistoryPage";
import NotFound from "./pages/NotFound";

// Reset scroll position on route change so navigating to a new page
// always starts at the top of the content area
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // The scrollable container is <main> inside AppLayout, not window
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, [pathname]);
  return null;
}

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
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
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </AppProvider>
  </BrowserRouter>
);

export default App;
