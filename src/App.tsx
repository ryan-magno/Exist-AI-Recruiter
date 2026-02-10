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
import HistoryPage from "./pages/HistoryPage";
import NotFound from "./pages/NotFound";

const App = () => (
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
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </AppProvider>
  </BrowserRouter>
);

export default App;
