import { PortfolioTab } from '@/components/dashboard/PortfolioTab';
import { useTranslation } from 'react-i18next';

export default function Portfolio() {
  const { t } = useTranslation();
  
  // Mock user data
  const user = {
    name: 'John Doe',
    userType: 'retail' as const,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t("dashboard.myPortfolio")}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {t("dashboard.portfolioOverview")}
          </p>
        </div>

        {/* Portfolio Content */}
        <div className="space-y-6">
          <PortfolioTab />
        </div>
      </div>
    </div>
  );
}