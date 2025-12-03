import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useSmartBack } from "@/hooks/useSmartBack";
import { Shield, Zap, RefreshCw, Users, Globe, CheckCircle } from "lucide-react";
import lightLogoPath from "@assets/WNVaultedAssets_1753707707419.png";
import darkLogoPath from "@assets/VaultedAssets (1)_1753709040936.png";

export default function About() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const logoPath = theme === "dark" ? darkLogoPath : lightLogoPath;
  const { goBack } = useSmartBack();

  return (
    <div className="min-h-screen bg-white dark:bg-black py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={goBack}
            className="border-brand-dark-gold text-brand-dark-gold dark:text-brand-gold hover:bg-brand-gold/5"
          >
            ← {t('common.back')}
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <img
              src={logoPath}
              alt="Vaulted Assets Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {t('pages.about.title')}{" "}
            <span className="text-brand-dark-gold dark:text-brand-gold">
              Vaulted Assets
            </span>
          </h1>
          <h2 className="text-2xl lg:text-3xl font-semibold text-brand-dark-gold dark:text-brand-gold mb-8">
            {t('pages.about.subtitle')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            {t('pages.about.heroDescription')}
          </p>
        </div>

        {/* Platform Overview */}
        <div className="mb-16">
          <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="p-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed text-center">
                {t('pages.about.platformOverview')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Vision and Mission */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Globe className="w-6 h-6 text-brand-dark-gold dark:text-brand-gold mr-3" />
                {t('pages.about.vision.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                {t('pages.about.vision.description')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Zap className="w-6 h-6 text-brand-dark-gold dark:text-brand-gold mr-3" />
                {t('pages.about.mission.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {t('pages.about.mission.description')}
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-brand-dark-gold dark:text-brand-gold mr-2 mt-0.5" />
                  {t('pages.about.mission.points.buyOnline')}
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-brand-dark-gold dark:text-brand-gold mr-2 mt-0.5" />
                  {t('pages.about.mission.points.receiveTokens')}
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-brand-dark-gold dark:text-brand-gold mr-2 mt-0.5" />
                  {t('pages.about.mission.points.manageTokens')}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* What We Offer */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {t('pages.about.whatWeOffer.title')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.about.whatWeOffer.assetBacked.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('pages.about.whatWeOffer.assetBacked.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6 text-center">
                <Globe className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.about.whatWeOffer.blockchainChoice.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('pages.about.whatWeOffer.blockchainChoice.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.about.whatWeOffer.secureCustody.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('pages.about.whatWeOffer.secureCustody.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6 text-center">
                <RefreshCw className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.about.whatWeOffer.flexibleAccess.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('pages.about.whatWeOffer.flexibleAccess.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Choose Vaulted Assets */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {t('pages.about.whyChoose.title')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-brand-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-brand-dark-gold dark:text-brand-gold" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.about.whyChoose.trust.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('pages.about.whyChoose.trust.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-brand-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-brand-dark-gold dark:text-brand-gold" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.about.whyChoose.technology.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('pages.about.whyChoose.technology.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-brand-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-brand-dark-gold dark:text-brand-gold" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.about.whyChoose.transparency.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('pages.about.whyChoose.transparency.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-brand-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-brand-dark-gold dark:text-brand-gold" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.about.whyChoose.userCentric.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('pages.about.whyChoose.userCentric.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Our Commitment */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-brand-gold/10 to-brand-dark-gold/10 dark:from-brand-gold/20 dark:to-brand-dark-gold/20 border-brand-gold/30 dark:border-brand-gold/40">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
                {t('pages.about.commitment.title')}
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 text-center mb-8">
                {t('pages.about.commitment.description')}
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Shield className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('pages.about.commitment.vaultAudits.title')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t('pages.about.commitment.vaultAudits.description')}
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('pages.about.commitment.contractAudits.title')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t('pages.about.commitment.contractAudits.description')}
                  </p>
                </div>
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('pages.about.commitment.fairFees.title')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t('pages.about.commitment.fairFees.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-brand-dark-gold/5 dark:bg-brand-gold/10 border-brand-dark-gold/20 dark:border-brand-gold/30 inline-block">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t('pages.about.cta.title')}
              </h2>
              <p className="text-xl text-brand-dark-gold dark:text-brand-gold font-semibold mb-6">
                {t('pages.about.cta.subtitle')}
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                {t('pages.about.cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-brand-dark-gold dark:bg-brand-gold text-white hover:bg-brand-dark-gold/90 dark:hover:bg-brand-gold/90 px-8 py-3 text-lg"
                  onClick={() => window.location.href = '/signup'}
                >
                  {t('pages.about.cta.getStarted')}
                </Button>
                <Button
                  variant="outline"
                  className="border-brand-dark-gold text-brand-dark-gold dark:text-brand-gold hover:bg-brand-dark-gold/10 dark:hover:bg-brand-gold/10 px-8 py-3 text-lg"
                  onClick={() => window.location.href = '/contact'}
                >
                  {t('pages.about.cta.contactUs')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}