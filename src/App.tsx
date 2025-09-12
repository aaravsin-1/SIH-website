import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AuthNew from "./pages/AuthNew";
import StudentDetailsForm from "./pages/StudentDetailsForm";
import TeacherDashboard from "./pages/TeacherDashboard";
import BookCounseling from "./pages/BookCounseling";
import AppointmentsManagement from "./pages/AppointmentsManagement";
import PeerSupport from "./pages/PeerSupport";
import WellnessResources from "./pages/WellnessResources";
import SelfCareActivities from "./pages/SelfCareActivities";
import StudentInsights from "./pages/StudentInsights";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthNew />} />
            <Route path="/student-details" element={<StudentDetailsForm />} />
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
            <Route path="/book-counseling" element={<BookCounseling />} />
            <Route path="/appointments" element={<AppointmentsManagement />} />
            <Route path="/peer-support" element={<PeerSupport />} />
            <Route path="/wellness-resources" element={<WellnessResources />} />
            <Route path="/self-care-activities" element={<SelfCareActivities />} />
            <Route path="/student-insights" element={<StudentInsights />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
