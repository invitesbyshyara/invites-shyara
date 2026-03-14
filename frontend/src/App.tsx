import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { PlatformStatusProvider } from "@/contexts/PlatformStatusContext";
import { AdminAuthProvider } from "@/admin/contexts/AdminAuthContext";
import ImpersonationBanner from "@/admin/components/ImpersonationBanner";
import CustomerAcquisitionBanner from "@/components/CustomerAcquisitionBanner";
import CookieConsent from "@/components/CookieConsent";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";

// Customer pages
const Home = lazy(() => import("./pages/Home"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Gallery = lazy(() => import("./pages/Gallery"));
const TemplatePreview = lazy(() => import("./pages/TemplatePreview"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CreateInvite = lazy(() => import("./pages/CreateInvite"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditInvite = lazy(() => import("./pages/EditInvite"));
const InviteOperations = lazy(() => import("./pages/InviteOperations"));
const RsvpManagement = lazy(() => import("./pages/RsvpManagement"));
const Account = lazy(() => import("./pages/Account"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PublishSuccess = lazy(() => import("./pages/PublishSuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LiveInvite = lazy(() => import("./pages/LiveInvite"));
const SampleInvite = lazy(() => import("./pages/SampleInvite"));

// Admin pages
const AdminLogin = lazy(() => import("./admin/pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./admin/pages/Dashboard"));
const AdminCustomers = lazy(() => import("./admin/pages/Customers"));
const AdminCustomerDetail = lazy(() => import("./admin/pages/CustomerDetail"));
const AdminAddCustomer = lazy(() => import("./admin/pages/AddCustomer"));
const AdminInvites = lazy(() => import("./admin/pages/Invites"));
const AdminInviteDetail = lazy(() => import("./admin/pages/InviteDetail"));
const AdminTemplates = lazy(() => import("./admin/pages/Templates"));
const AdminTemplateEdit = lazy(() => import("./admin/pages/TemplateEdit"));
const AdminAddTemplate = lazy(() => import("./admin/pages/AddTemplate"));
const AdminTransactions = lazy(() => import("./admin/pages/Transactions"));
const AdminFailedPayments = lazy(() => import("./admin/pages/FailedPayments"));
const AdminCategories = lazy(() => import("./admin/pages/Categories"));
const AdminPromoCodes = lazy(() => import("./admin/pages/PromoCodes"));
const AdminAnnouncements = lazy(() => import("./admin/pages/Announcements"));
const AdminSettings = lazy(() => import("./admin/pages/Settings"));
const AdminSecurityEvents = lazy(() => import("./admin/pages/SecurityEvents"));

const queryClient = new QueryClient();

const ScrollToHash = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const id = location.hash.replace("#", "");
    const target = document.getElementById(id);
    if (!target) {
      return;
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.pathname, location.hash]);

  return null;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-sm text-muted-foreground font-body">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <BrowserRouter>
                <PlatformStatusProvider>
                  <ScrollToHash />
                  <Toaster />
                  <Sonner />
                  <ImpersonationBanner />
                  <CustomerAcquisitionBanner />
                  <CookieConsent />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public pages */}
                      <Route path="/" element={<Home />} />
                      <Route path="/templates" element={<Gallery />} />
                      <Route path="/templates/:slug/preview" element={<TemplatePreview />} />
                      <Route path="/samples/:slug" element={<SampleInvite />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />

                      {/* Auth pages */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />

                      {/* Authenticated pages */}
                      <Route path="/checkout/:slug" element={<Checkout />} />
                      <Route path="/create/:inviteId" element={<CreateInvite />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/dashboard/invites/:inviteId/edit" element={<EditInvite />} />
                      <Route path="/dashboard/invites/:inviteId/operations" element={<InviteOperations />} />
                      <Route path="/dashboard/invites/:inviteId/rsvps" element={<RsvpManagement />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/publish-success/:inviteId" element={<PublishSuccess />} />

                      {/* Live invite */}
                      <Route path="/i/:slug" element={<LiveInvite />} />

                      {/* Admin Portal */}
                      <Route path="/admin/login" element={<AdminAuthProvider><AdminLogin /></AdminAuthProvider>} />
                      <Route path="/admin" element={<AdminAuthProvider><AdminDashboard /></AdminAuthProvider>} />
                      <Route path="/admin/customers" element={<AdminAuthProvider><AdminCustomers /></AdminAuthProvider>} />
                      <Route path="/admin/customers/new" element={<AdminAuthProvider><AdminAddCustomer /></AdminAuthProvider>} />
                      <Route path="/admin/customers/:id" element={<AdminAuthProvider><AdminCustomerDetail /></AdminAuthProvider>} />
                      <Route path="/admin/invites" element={<AdminAuthProvider><AdminInvites /></AdminAuthProvider>} />
                      <Route path="/admin/invites/:id" element={<AdminAuthProvider><AdminInviteDetail /></AdminAuthProvider>} />
                      <Route path="/admin/templates" element={<AdminAuthProvider><AdminTemplates /></AdminAuthProvider>} />
                      <Route path="/admin/templates/new" element={<AdminAuthProvider><AdminAddTemplate /></AdminAuthProvider>} />
                      <Route path="/admin/templates/:slug" element={<AdminAuthProvider><AdminTemplateEdit /></AdminAuthProvider>} />
                      <Route path="/admin/transactions" element={<AdminAuthProvider><AdminTransactions /></AdminAuthProvider>} />
                      <Route path="/admin/transactions/failed" element={<AdminAuthProvider><AdminFailedPayments /></AdminAuthProvider>} />
                      <Route path="/admin/categories" element={<AdminAuthProvider><AdminCategories /></AdminAuthProvider>} />
                      <Route path="/admin/promo-codes" element={<AdminAuthProvider><AdminPromoCodes /></AdminAuthProvider>} />
                      <Route path="/admin/announcements" element={<AdminAuthProvider><AdminAnnouncements /></AdminAuthProvider>} />
                      <Route path="/admin/settings" element={<AdminAuthProvider><AdminSettings /></AdminAuthProvider>} />
                      <Route path="/admin/security-events" element={<AdminAuthProvider><AdminSecurityEvents /></AdminAuthProvider>} />

                      {/* Catch-all */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </PlatformStatusProvider>
              </BrowserRouter>
            </TooltipProvider>
          </CurrencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </MotionConfig>
  </ThemeProvider>
);
export default App;
