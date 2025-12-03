import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import axios from "@/lib/axios";

export function OnboardingKycBanner() {
  const [, setLocation] = useLocation();
  const { user } = useAuthStore();
  const [isVisible, setIsVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [redirectPath, setRedirectPath] = useState("/onboarding");
  const [isDismissed, setIsDismissed] = useState(false);
  const hasCheckedStatus = useRef(false);

  useEffect(() => {
    const checkStatus = async () => {
      // Prevent multiple checks
      if (hasCheckedStatus.current || !user) {
        return;
      }

      try {
        hasCheckedStatus.current = true;
        console.log('[Banner] Checking onboarding/KYC status...');

        // Check if onboarding is complete
        if (!user.isOnboarded) {
          console.log('[Banner] Onboarding not complete');
          setBannerMessage("Your profile is incomplete. Please complete your onboarding before making any investments.");
          setRedirectPath("/onboarding");
          setIsVisible(true);
          return;
        }

        // Check KYC status - first try to use cached status from user store
        let kycStatus = user.kyc_status;
        
        // If not in store or we need fresh data, fetch from API
        if (!kycStatus) {
          console.log('[Banner] Fetching KYC status from API...');
          const kycResponse = await axios.get('/api/kyc/status');
          console.log('[Banner] KYC status response:', kycResponse.data);
          
          if (kycResponse.data.success) {
            kycStatus = kycResponse.data.kycStatus;
          }
        } else {
          console.log('[Banner] Using cached KYC status:', kycStatus);
        }
        
        // Determine banner visibility based on KYC status
        if (kycStatus === 'not_started') {
          setBannerMessage("KYC verification is required. Please complete your KYC verification before making any investments.");
          setRedirectPath("/onboarding");
          setIsVisible(true);
        } else if (kycStatus === 'pending' || kycStatus === 'review') {
          setBannerMessage("Your KYC verification is under review. You'll be able to invest once it's approved.");
          setRedirectPath("/onboarding");
          setIsVisible(true);
        } else if (kycStatus === 'rejected') {
          setBannerMessage("Your KYC verification was rejected. Please resubmit your KYC documents to continue investing.");
          setRedirectPath("/onboarding");
          setIsVisible(true);
        } else if (kycStatus === 'approved') {
          console.log('[Banner] KYC approved, hiding banner');
          setIsVisible(false);
        }
      } catch (error) {
        console.error('[Banner] Error checking onboarding/KYC status:', error);
        setIsVisible(false);
        hasCheckedStatus.current = false; // Reset on error to allow retry
      }
    };

    checkStatus();
    // Empty dependency array - only check once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = () => {
    setLocation(redirectPath);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't show on onboarding or login/signup pages
  const currentPath = window.location.pathname;
  if (currentPath === '/onboarding' || currentPath === '/signin' || currentPath === '/signup' || currentPath === '/') {
    return null;
  }

  if (!isVisible || isDismissed || !user) {
    return null;
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-b-2 border-red-500 dark:border-red-600 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 gap-3">
          <div className="flex items-start flex-1 min-w-0">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {bannerMessage}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
            <Button
              onClick={handleComplete}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600 h-9 px-5 font-medium"
            >
              Complete Now
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

