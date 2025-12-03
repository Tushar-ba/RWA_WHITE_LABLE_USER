import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Zap, RefreshCw, Globe, Coins, TrendingUp, CheckCircle, ArrowRight, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useSmartBack } from "@/hooks/useSmartBack";
import lightLogoPath from "@assets/WNVaultedAssets_1753707707419.png";
import darkLogoPath from "@assets/VaultedAssets (1)_1753709040936.png";

export default function SilverTokens() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const logoPath = theme === "dark" ? darkLogoPath : lightLogoPath;
  const { goBack } = useSmartBack();

  const handleGetStarted = () => {
    window.location.href = '/signup';
  };

  const handlePartnerWithUs = () => {
    window.location.href = '/contact';
  };

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
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            {t('pages.silverTokens.heroTitle')}
          </h1>
          <h2 className="text-3xl lg:text-4xl font-semibold text-gray-600 dark:text-gray-300 mb-8">
            {t('pages.silverTokens.heroSubtitle')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
            {t('pages.silverTokens.heroDescription')}
          </p>
        </div>

        {/* Key Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 border-gray-200 dark:border-gray-600">
            <CardContent className="p-6 text-center">
              <Coins className="w-12 h-12 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('pages.silverTokens.features.directlyBacked.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('pages.silverTokens.features.directlyBacked.description')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-6 text-center">
              <Globe className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('pages.silverTokens.features.multiChain.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('pages.silverTokens.features.multiChain.description')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-6 text-center">
              <Zap className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('pages.silverTokens.features.useYourWay.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('pages.silverTokens.features.useYourWay.description')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('pages.silverTokens.features.auditsProof.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('pages.silverTokens.features.auditsProof.description')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-6 text-center">
              <RefreshCw className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('pages.silverTokens.features.redeemable.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('pages.silverTokens.features.redeemable.description')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action Section */}
        <div className="text-center mb-16">
          <Card className="bg-gray-50/80 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 inline-block">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t('pages.silverTokens.cta.title')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 font-semibold mb-8 max-w-3xl">
                {t('pages.silverTokens.cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleGetStarted}
                  className="bg-brand-dark-gold dark:bg-brand-gold text-white hover:bg-brand-dark-gold/90 dark:hover:bg-brand-gold/90 px-8 py-3 text-lg"
                >
                  {t('pages.silverTokens.cta.getStarted')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  onClick={handlePartnerWithUs}
                  variant="outline"
                  className="border-brand-dark-gold text-brand-dark-gold dark:text-brand-gold hover:bg-brand-dark-gold/10 dark:hover:bg-brand-gold/10 px-8 py-3 text-lg"
                >
                  <Users className="w-5 h-5 mr-2" />
                  {t('pages.silverTokens.cta.partnerWithUs')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learn More Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            {t('pages.silverTokens.learnMore.title')}
          </h2>
          
          <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.silverTokens.learnMore.objective.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {t('pages.silverTokens.learnMore.objective.description1')}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('pages.silverTokens.learnMore.objective.description2')}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Technical Details Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.silverTokens.technicalDetails.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('pages.silverTokens.technicalDetails.pricing.title')}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t('pages.silverTokens.technicalDetails.pricing.description')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('pages.silverTokens.technicalDetails.creation.title')}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t('pages.silverTokens.technicalDetails.creation.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('pages.silverTokens.technicalDetails.fees.title')}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t('pages.silverTokens.technicalDetails.fees.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('pages.silverTokens.technicalDetails.redemption.title')}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t('pages.silverTokens.technicalDetails.redemption.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.silverTokens.security.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('pages.silverTokens.security.custody.title')}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t('pages.silverTokens.security.custody.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Specification Card */}
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/20 dark:to-slate-800/20 border-gray-200 dark:border-gray-600 mb-16">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                S
              </div>
              {t('pages.silverTokens.tokenSpec.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-2">1:1</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{t('pages.silverTokens.tokenSpec.ratio')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-2">100%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{t('pages.silverTokens.tokenSpec.backed')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-2">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{t('pages.silverTokens.tokenSpec.redeemable')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {t('pages.silverTokens.disclaimer.title')}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {t('pages.silverTokens.disclaimer.description')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}