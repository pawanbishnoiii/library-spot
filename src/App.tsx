import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotFound from "./pages/NotFound";

// User Pages
import UserDashboard from "./pages/user/UserDashboard";
import UserBookings from "./pages/user/UserBookings";
import UserProfile from "./pages/user/UserProfile";
import UserNotifications from "./pages/user/UserNotifications";
import UserMemberships from "./pages/user/UserMemberships";

// Owner Pages
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerLibrary from "./pages/owner/OwnerLibrary";
import OwnerSeats from "./pages/owner/OwnerSeats";
import OwnerBookings from "./pages/owner/OwnerBookings";
import OwnerPayments from "./pages/owner/OwnerPayments";
import OwnerStaff from "./pages/owner/OwnerStaff";
import OwnerShifts from "./pages/owner/OwnerShifts";
import OwnerNotifications from "./pages/owner/OwnerNotifications";
import OwnerSettings from "./pages/owner/OwnerSettings";
import OwnerDesigner from "./pages/owner/OwnerDesigner";
import OwnerAccounts from "./pages/owner/OwnerAccounts";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLibraries from "./pages/admin/AdminLibraries";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminMemberships from "./pages/admin/AdminMemberships";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSupport from "./pages/admin/AdminSupport";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, role, isLoading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role || 'user')) {
    return <Navigate to="/user/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, role } = useAuth();
  
  const getDashboardPath = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'owner') return '/owner/dashboard';
    return '/user/dashboard';
  };
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={user ? <Navigate to={getDashboardPath()} replace /> : <Index />} />
      <Route path="/home" element={<Index />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/library/:slug" element={<LibraryPage />} />
      <Route path="/auth/login" element={user ? <Navigate to={getDashboardPath()} replace /> : <AuthPage />} />
      <Route path="/auth/signup" element={user ? <Navigate to={getDashboardPath()} replace /> : <AuthPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      
      {/* User Routes */}
      <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/user/bookings" element={<ProtectedRoute><UserBookings /></ProtectedRoute>} />
      <Route path="/user/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/user/notifications" element={<ProtectedRoute><UserNotifications /></ProtectedRoute>} />
      <Route path="/user/memberships" element={<ProtectedRoute><UserMemberships /></ProtectedRoute>} />
      
      {/* Owner Routes */}
      <Route path="/owner/dashboard" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerDashboard /></ProtectedRoute>} />
      <Route path="/owner/library" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerLibrary /></ProtectedRoute>} />
      <Route path="/owner/seats" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerSeats /></ProtectedRoute>} />
      <Route path="/owner/bookings" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerBookings /></ProtectedRoute>} />
      <Route path="/owner/payments" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerPayments /></ProtectedRoute>} />
      <Route path="/owner/staff" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerStaff /></ProtectedRoute>} />
      <Route path="/owner/shifts" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerShifts /></ProtectedRoute>} />
      <Route path="/owner/notifications" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerNotifications /></ProtectedRoute>} />
      <Route path="/owner/settings" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerSettings /></ProtectedRoute>} />
      <Route path="/owner/designer" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerDesigner /></ProtectedRoute>} />
      <Route path="/owner/accounts" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerAccounts /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/libraries" element={<ProtectedRoute allowedRoles={['admin']}><AdminLibraries /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['admin']}><AdminBookings /></ProtectedRoute>} />
      <Route path="/admin/memberships" element={<ProtectedRoute allowedRoles={['admin']}><AdminMemberships /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/support" element={<ProtectedRoute allowedRoles={['admin']}><AdminSupport /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
