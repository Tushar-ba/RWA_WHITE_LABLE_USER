import { InvestmentsTab } from '@/components/dashboard/InvestmentsTab';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  
  // Check if user is onboarded
  const isOnboarded = user?.isOnboarded !== false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Onboarding Banner */}
        {!isOnboarded && (
          <Alert className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200">
              Complete Your Profile
            </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300 flex items-center justify-between">
              <span>
                Please complete your onboarding to access all features.
              </span>
              <Button
                onClick={() => setLocation("/onboarding")}
                className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Complete Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("dashboard.assets")}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {t("dashboard.browseAndInvest")}
          </p>
        </div>

        {/* Assets Content */}
        <div className="space-y-6">
          <InvestmentsTab />
        </div>
      </div>
    </div>
  );
}