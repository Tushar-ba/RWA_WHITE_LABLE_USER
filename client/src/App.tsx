import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppKitProvider } from "@/contexts/AppKitProvider";
import Layout from "@/components/layout/Layout";
import { useAuthStore } from "@/stores/authStore";
import { MoonPayProvider } from "@moonpay/moonpay-react";
import ScrollToTop from "@/components/ScrollToTop";
import React from "react";

// Public Pages (accessible to all)
import Landing from "@/pages/landing";
import About from "@/pages/about";
import Whitepaper from "@/pages/whitepaper";
import Contact from "@/pages/contact";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import CookiePolicy from "@/pages/cookie-policy";
import FAQ from "@/pages/faq";
import GoldTokens from "@/pages/gold-tokens";
import SilverTokens from "@/pages/silver-tokens";
import Tokenomics from "@/pages/tokenomics";
import AuditReport from "@/pages/audit-report";
import NotFound from "@/pages/not-found";

// Guest-Only Pages (accessible only when not authenticated)
import Signup from "@/pages/signup";
import SignIn from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";

// Protected Pages (accessible only when authenticated)
import Dashboard from "@/pages/dashboard";
import Portfolio from "@/pages/portfolio";
import TransactionHistory from "@/pages/transaction-history";
import Profile from "@/pages/profile";
import GiftingTransfer from "@/pages/gifting-transfer";
import Redemption from "@/pages/redemption";
import Referral from "@/pages/referral";
import Onboarding from "@/pages/onboarding";

const REACT_APP_MOONPAY_API_KEY = 
  import.meta.env.REACT_APP_MOONPAY_API_KEY || 'pk_test_sjFYcrEvNeR6SMe8OQ4AmhN5nAk6JIE';

/**
 * GuestRoute Component
 * Restricts access for authenticated users
 * Redirects authenticated users to dashboard
 */
function GuestRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Redirect to="/assets" />;
  }
  
  return <Component />;
}

/**
 * ProtectedRoute Component
 * Restricts access for unauthenticated users
 * Redirects unauthenticated users to login page
 */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <Component />;
}

/**
 * Router Component
 * Manages all application routes with proper access control
 */
function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        {/* Public Routes - Accessible to all users */}
        <Route path="/" component={Landing} />
        <Route path="/about" component={About} />
        <Route path="/whitepaper" component={Whitepaper} />
        <Route path="/contact" component={Contact} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/cookie-policy" component={CookiePolicy} />
        <Route path="/faq" component={FAQ} />
        <Route path="/gold-tokens" component={GoldTokens} />
        <Route path="/silver-tokens" component={SilverTokens} />
        <Route path="/tokenomics" component={Tokenomics} />
        <Route path="/audit-report" component={AuditReport} />

        {/* Guest-Only Routes - Accessible only to unauthenticated users */}
        <Route path="/signup">
          <GuestRoute component={Signup} />
        </Route>
        <Route path="/signin">
          <GuestRoute component={SignIn} />
        </Route>
        <Route path="/login">
          <GuestRoute component={SignIn} />
        </Route>
        <Route path="/forgot-password">
          <GuestRoute component={ForgotPassword} />
        </Route>
        <Route path="/reset-password">
          <GuestRoute component={ResetPassword} />
        </Route>

        {/* Protected Routes - Accessible only to authenticated users */}
        <Route path="/assets">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/portfolio">
          <ProtectedRoute component={Portfolio} />
        </Route>
        <Route path="/transaction-history">
          <ProtectedRoute component={TransactionHistory} />
        </Route>
        <Route path="/profile">
          <ProtectedRoute component={Profile} />
        </Route>
        <Route path="/gifting">
          <ProtectedRoute component={GiftingTransfer} />
        </Route>
        <Route path="/redemption">
          <ProtectedRoute component={Redemption} />
        </Route>  
        <Route path="/referral">
          <ProtectedRoute component={Referral} />
        </Route>
        <Route path="/onboarding">
          <ProtectedRoute component={Onboarding} />
        </Route>

        {/* 404 - Not Found Route */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

/**
 * AppContent Component
 * Main application content wrapper with layout and authentication state
 */
function AppContent() {
  const { isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Layout isAuthenticated={isAuthenticated} onLogout={handleLogout}>
        <Router />
      </Layout>
      <Toaster />
    </div>
  );
}

/**
 * App Component
 * Root application component with all necessary providers
 * Provider hierarchy:
 * - ThemeProvider: Manages theme state (light/dark mode)
 * - AppKitProvider: Manages wallet connection and blockchain interactions
 * - TooltipProvider: Provides tooltip functionality across the app
 * - MoonPayProvider: Enables cryptocurrency purchase functionality
 */
function App() {
  return (
    <ThemeProvider>
      <AppKitProvider>
        <TooltipProvider>
          <MoonPayProvider apiKey={REACT_APP_MOONPAY_API_KEY} debug>
            <AppContent />
          </MoonPayProvider>
        </TooltipProvider>
      </AppKitProvider>
    </ThemeProvider>
  );
}

export default App;