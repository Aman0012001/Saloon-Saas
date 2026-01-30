import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SalonProvider } from "@/hooks/useSalon";
import { SuperAdminProvider } from "@/hooks/useSuperAdmin";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import "@/utils/adminBypass"; // Auto-enable admin bypass
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BookAppointment from "./pages/BookAppointment";
import MyBookings from "./pages/MyBookings";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import DashboardHome from "./pages/dashboard/DashboardHome";
import CreateSalon from "./pages/dashboard/CreateSalon";
import AppointmentsPage from "./pages/dashboard/AppointmentsPage";
import StaffPage from "./pages/dashboard/StaffPage";
import StaffDetailsPage from "./pages/dashboard/StaffDetailsPage";
import StaffAttendancePage from "./pages/dashboard/StaffAttendancePage";
import ServicesPage from "./pages/dashboard/ServicesPage";
import CustomersPage from "./pages/dashboard/CustomersPage";
import CustomerDetailsPage from "./pages/dashboard/CustomerDetailsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import BillingPage from "./pages/dashboard/BillingPage";
import InventoryPage from "./pages/dashboard/InventoryPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import OwnerProfile from "./pages/dashboard/OwnerProfile";
import OffersPage from "./pages/dashboard/OffersPage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import StaffLeavesPage from "./pages/dashboard/StaffLeavesPage";
import StaffMessagesPage from "./pages/dashboard/StaffMessagesPage";
import LoyaltyPage from "./pages/dashboard/LoyaltyPage";
import KnowledgeBasePage from "./pages/dashboard/KnowledgeBasePage";
import SalonOwnerLogin from "./pages/SalonOwnerLogin";
import AboutUs from "./pages/AboutUs";
import SalonListing from "./pages/SalonListing";
import SalonServices from "./pages/SalonServices";
import AdminSetup from "./pages/AdminSetup";
import AllServicesSimple from "./pages/AllServicesSimple";
import ServiceDetail from "./pages/ServiceDetail";
import Pricing from "./pages/Pricing";
import ContactUs from "./pages/ContactUs";
// Super Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDashboardEnhanced from "./pages/admin/AdminDashboardEnhanced";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSalons from "./pages/admin/AdminSalons";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUsersEnhanced from "./pages/admin/AdminUsersEnhanced";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminPaymentsEnhanced from "./pages/admin/AdminPaymentsEnhanced";
import AdminMarketing from "./pages/admin/AdminMarketing";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminAddProduct from "./pages/admin/AdminAddProduct";
import AdminContactEnquiries from "./pages/admin/AdminContactEnquiries";
import AdminMembershipPlans from "./pages/admin/AdminMembershipPlans";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminAccess from "./pages/AdminAccess";
import SimpleAdminAccess from "./pages/SimpleAdminAccess";
import TestAdminLogin from "./pages/TestAdminLogin";
import DebugSupabase from "./pages/DebugSupabase";
import CreateAdminCredentials from "./pages/CreateAdminCredentials";
import DirectAdminAccess from "./pages/DirectAdminAccess";
import SupabaseDebug from "./pages/SupabaseDebug";
import CustomerSignup from "./pages/CustomerSignup";
import SalonOwnerSignup from "./pages/Signup";
import UnifiedSignup from "./pages/UnifiedSignup";
import ClientHub from "./pages/ClientHub";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SupplyStore from "./pages/dashboard/SupplyStore";
import RetailShop from "./pages/RetailShop";
import ProductDetails from "./pages/ProductDetails";
import SessionHistory from "./pages/SessionHistory";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SuperAdminProvider>
        <SalonProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/salons" element={<SalonListing />} />
                <Route path="/salons/:id" element={<SalonServices />} />
                <Route path="/services" element={<AllServicesSimple />} />
                <Route path="/services/:id" element={<ServiceDetail />} />
                <Route path="/services-simple" element={<AllServicesSimple />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/shop" element={<RetailShop />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/admin-setup" element={<AdminSetup />} />
                <Route path="/admin-access" element={<SimpleAdminAccess />} />
                <Route path="/admin-access-full" element={<AdminAccess />} />
                <Route path="/test-admin" element={<TestAdminLogin />} />
                <Route path="/debug-supabase" element={<DebugSupabase />} />
                <Route path="/supabase-debug" element={<SupabaseDebug />} />
                <Route path="/create-admin" element={<CreateAdminCredentials />} />
                <Route path="/direct-admin" element={<DirectAdminAccess />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<UnifiedSignup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/salon-owner/signup" element={<SalonOwnerSignup />} />
                <Route path="/salon-owner/login" element={<SalonOwnerLogin />} />
                <Route path="/book" element={<BookAppointment />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/client-hub" element={<ClientHub />} />
                <Route path="/my-sessions" element={<SessionHistory />} />
                <Route path="/dashboard" element={<DashboardHome />} />
                <Route path="/dashboard/create-salon" element={<CreateSalon />} />
                <Route path="/dashboard/appointments" element={<AppointmentsPage />} />
                <Route path="/dashboard/staff" element={<StaffPage />} />
                <Route path="/dashboard/staff/:id" element={<StaffDetailsPage />} />
                <Route path="/dashboard/services" element={<ServicesPage />} />
                <Route path="/dashboard/customers" element={<CustomersPage />} />
                <Route path="/dashboard/customers/:userId" element={<CustomerDetailsPage />} />
                <Route path="/dashboard/billing" element={<BillingPage />} />
                <Route path="/dashboard/inventory" element={<InventoryPage />} />
                <Route path="/dashboard/store" element={<SupplyStore />} />
                <Route path="/dashboard/store/:id" element={<ProductDetails />} />
                <Route path="/dashboard/reports" element={<ReportsPage />} />
                <Route path="/dashboard/offers" element={<OffersPage />} />
                <Route path="/dashboard/loyalty" element={<LoyaltyPage />} />
                <Route path="/dashboard/knowledge-base" element={<KnowledgeBasePage />} />
                <Route path="/dashboard/profile" element={<OwnerProfile />} />
                <Route path="/dashboard/settings" element={<SettingsPage />} />
                <Route path="/dashboard/notifications" element={<NotificationsPage />} />
                <Route path="/dashboard/staff/attendance" element={<StaffAttendancePage />} />
                <Route path="/dashboard/staff/leaves" element={<StaffLeavesPage />} />
                <Route path="/dashboard/staff/messages" element={<StaffMessagesPage />} />
                {/* Super Admin Routes */}
                <Route path="/admin" element={<AdminDashboardEnhanced />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/salons" element={<AdminSalons />} />
                <Route path="/admin/members" element={<AdminMembers />} />
                <Route path="/admin/users" element={<AdminUsersEnhanced />} />
                <Route path="/admin/payments" element={<AdminPaymentsEnhanced />} />
                <Route path="/admin/marketing" element={<AdminMarketing />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/products/add" element={<AdminAddProduct />} />
                <Route path="/admin/contact-enquiries" element={<AdminContactEnquiries />} />
                <Route path="/admin/plans" element={<AdminMembershipPlans />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SalonProvider>
      </SuperAdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
