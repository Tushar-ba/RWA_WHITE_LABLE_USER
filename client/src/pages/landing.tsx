import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import heroBackgroundImage from "../assets/landing-hero.png";

export default function Landing() {
  const { t } = useTranslation("common");
  const { isAuthenticated } = useAuthStore();
  const [, setLocation] = useLocation();

  const handleStartInvesting = () => {
    if (isAuthenticated) {
      setLocation("/assets");
    } else {
      setLocation("/signin");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div
        className="relative h-[600px] overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.3)), url(${heroBackgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative max-w-7xl mx-auto px-8 lg:px-16 h-full flex items-center">
          <div className="w-full max-w-2xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {t("landing.heroTitle")}
            </h1>
            <p className="text-lg text-white/90 mb-8 leading-relaxed max-w-xl">
              {t("landing.heroSubtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 mb-8">
              <Button
                size="lg"
                className="px-6 py-3 bg-brand-gold hover:bg-brand-dark-gold text-black rounded-lg font-medium transition-all"
                onClick={handleStartInvesting}
                data-testid="button-start-investing"
              >
                {t("landing.startInvesting")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-6 py-3 border border-white/30 bg-white text-black hover:bg-transparent hover:text-white rounded-lg font-medium transition-all"
                onClick={() => setLocation("/about")}
                data-testid="button-learn-more"
              >
                {t("landing.learnMore")}
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-brand-gold rounded-full mr-3"></div>
                <span className="text-white/90 text-sm">
                  {t("landing.trustIndicators.physicallyBacked")}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-brand-gold rounded-full mr-3"></div>
                <span className="text-white/90 text-sm">
                  {t("landing.trustIndicators.kycCompliant")}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-brand-gold rounded-full mr-3"></div>
                <span className="text-white/90 text-sm">
                  {t("landing.trustIndicators.priceAccuracy")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t("features.whyChoose")}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-brand-dark-gold/10 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8 text-brand-dark-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t("features.bankGradeSecurity")}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("features.bankGradeDescription")}
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-brand-gold/10 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8 text-brand-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t("features.instantLiquidity")}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("features.instantLiquidityDescription")}
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t("features.regulatoryCompliance")}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("features.regulatoryComplianceDescription")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
