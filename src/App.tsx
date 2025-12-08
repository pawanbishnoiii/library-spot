import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

// User Pages
import UserDashboard from "./pages/user/UserDashboard";
import UserBookings from "./pages/user/UserBookings";
import UserProfile from "./pages/user/UserProfile";

// Owner Pages
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerLibrary from "./pages/owner/OwnerLibrary";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLibraries from "./pages/admin/AdminLibraries";
import AdminUsers from "./pages/admin/AdminUsers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/library/:slug" element={<LibraryPage />} />
            <Route path="/auth/login" element={<AuthPage />} />
            <Route path="/auth/signup" element={<AuthPage />} />
            
            {/* User Routes */}
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/bookings" element={<UserBookings />} />
            <Route path="/user/profile" element={<UserProfile />} />
            
            {/* Owner Routes */}
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/library" element={<OwnerLibrary />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/libraries" element={<AdminLibraries />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
