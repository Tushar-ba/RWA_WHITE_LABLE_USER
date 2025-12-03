import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useSmartBack } from '@/hooks/useSmartBack';
import { Shield, Zap, FileText, Download, Globe, Users, TrendingUp, Lock, Coins, Building, Eye, CheckCircle } from 'lucide-react';
import lightLogoPath from '@assets/WNVaultedAssets_1753707707419.png';
import darkLogoPath from '@assets/VaultedAssets (1)_1753709040936.png';
import whitePaperPDF from '../assets/docs/Vaulted Assets Whitepaper.pdf'
export default function Whitepaper() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const logoPath = theme === 'dark' ? darkLogoPath : lightLogoPath;
  const { goBack } = useSmartBack();

  const handleDownload = () => {
    try {
      // Download the actual whitepaper PDF
      const link = document.createElement('a');
      link.href = whitePaperPDF;
      link.download = 'Vaulted-Assets-Whitepaper.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Fallback to text download if PDF download fails
      const whitepaperContent = generateWhitepaperText();
      const blob = new Blob([whitepaperContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Vaulted-Assets-Whitepaper.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  const handleViewOnline = () => {
    try {
      // Open the actual whitepaper PDF in a new tab
      window.open(whitePaperPDF, '_blank');
    } catch (error) {
      console.error('Error opening PDF for viewing:', error);
      // Fallback to HTML view if PDF viewing fails
      const whitepaperContent = generateWhitepaperText();
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Vaulted Assets Whitepaper</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                h1 { color: #B8860B; }
                h2 { color: #333; margin-top: 30px; }
                .section { margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <pre style="white-space: pre-wrap; font-family: inherit;">${whitepaperContent}</pre>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  const generateWhitepaperText = () => {
    return `VAULTED ASSETS WHITEPAPER

${t('pages.whitepaper.title')}

${t('pages.whitepaper.subtitle')}

Last Updated: ${new Date().toLocaleDateString()}

${t('pages.whitepaper.executiveSummary.title')}

${t('pages.whitepaper.executiveSummary.intro')}

${t('pages.whitepaper.executiveSummary.concept')}

${t('pages.whitepaper.executiveSummary.tokens')}

${t('pages.whitepaper.executiveSummary.features')}

${t('pages.whitepaper.executiveSummary.vision')}

${t('pages.whitepaper.problemStatement.title')}

${t('pages.whitepaper.problemStatement.intro')}

${t('pages.whitepaper.problemStatement.conclusion')}

For the complete whitepaper with detailed technical specifications, market analysis, and tokenomics, please contact our team.

Contact: info@vaultedassets.com
Website: https://vaultedassets.com

© ${new Date().getFullYear()} Vaulted Assets. All rights reserved.`;
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
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            <span className="text-brand-dark-gold dark:text-brand-gold">Vaulted Assets</span> {t('pages.whitepaper.title')}
          </h1>
          <h2 className="text-2xl lg:text-3xl font-semibold text-brand-dark-gold dark:text-brand-gold mb-8">
            {t('pages.whitepaper.subtitle')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            {t('pages.whitepaper.description')}
          </p>
        </div>

        {/* Download Section */}
        <div className="text-center mb-16">
          <Card className="bg-brand-dark-gold/5 dark:bg-brand-gold/10 border-brand-dark-gold/20 dark:border-brand-gold/30 inline-block">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleDownload}
                  className="bg-brand-dark-gold dark:bg-brand-gold text-white hover:bg-brand-dark-gold/90 dark:hover:bg-brand-gold/90 px-8 py-3 text-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {t('pages.whitepaper.downloadPdf')}
                </Button>
                <Button
                  onClick={handleViewOnline}
                  variant="outline"
                  className="border-brand-dark-gold text-brand-dark-gold dark:text-brand-gold hover:bg-brand-dark-gold/10 dark:hover:bg-brand-gold/10 px-8 py-3 text-lg"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {t('pages.whitepaper.viewOnline')}
                </Button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                {t('pages.whitepaper.lastUpdated')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Executive Summary */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {t('pages.whitepaper.executiveSummary.title')}
          </h2>
          <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="p-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {t('pages.whitepaper.executiveSummary.intro')}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {t('pages.whitepaper.executiveSummary.concept')}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {t('pages.whitepaper.executiveSummary.tokens')}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {t('pages.whitepaper.executiveSummary.features')}
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('pages.whitepaper.executiveSummary.vision')}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Problem Statement */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {t('pages.whitepaper.problemStatement.title')}
          </h2>
          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {t('pages.whitepaper.problemStatement.intro')}
              </p>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Users className="w-6 h-6 text-brand-dark-gold dark:text-brand-gold mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {t('pages.whitepaper.problemStatement.inaccessibility.title')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {t('pages.whitepaper.problemStatement.inaccessibility.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Zap className="w-6 h-6 text-brand-dark-gold dark:text-brand-gold mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {t('pages.whitepaper.problemStatement.liquidity.title')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {t('pages.whitepaper.problemStatement.liquidity.description')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Eye className="w-6 h-6 text-brand-dark-gold dark:text-brand-gold mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {t('pages.whitepaper.problemStatement.transparency.title')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {t('pages.whitepaper.problemStatement.transparency.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Globe className="w-6 h-6 text-brand-dark-gold dark:text-brand-gold mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {t('pages.whitepaper.problemStatement.digitalBarriers.title')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {t('pages.whitepaper.problemStatement.digitalBarriers.description')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('pages.whitepaper.problemStatement.conclusion')}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Market Opportunity */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {t('pages.whitepaper.marketOpportunity.title')}
          </h2>
          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
                {t('pages.whitepaper.marketOpportunity.intro')}
              </p>
              
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                {t('pages.whitepaper.marketOpportunity.trends.title')}
              </h3>
              
              <div className="space-y-6 mb-8">
                <div className="bg-brand-gold/5 dark:bg-brand-gold/10 p-6 rounded-lg">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <TrendingUp className="w-6 h-6 text-brand-dark-gold dark:text-brand-gold mr-3" />
                    {t('pages.whitepaper.marketOpportunity.goldSilverDemand.title')}
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded">
                      <div className="text-2xl font-bold text-brand-dark-gold dark:text-brand-gold mb-2">1,206t</div>
                      <div className="text-gray-600 dark:text-gray-300">{t('pages.whitepaper.marketOpportunity.goldSilverDemand.q1Demand')}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded">
                      <div className="text-2xl font-bold text-brand-dark-gold dark:text-brand-gold mb-2">170%</div>
                      <div className="text-gray-600 dark:text-gray-300">{t('pages.whitepaper.marketOpportunity.goldSilverDemand.investmentSurge')}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded">
                      <div className="text-2xl font-bold text-brand-dark-gold dark:text-brand-gold mb-2">29%</div>
                      <div className="text-gray-600 dark:text-gray-300">{t('pages.whitepaper.marketOpportunity.goldSilverDemand.priceIncrease')}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        {t('pages.whitepaper.marketOpportunity.trendsTable.trend')}
                      </th>
                      <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        {t('pages.whitepaper.marketOpportunity.trendsTable.relevance')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-700 dark:text-gray-300">
                        {t('pages.whitepaper.marketOpportunity.trendsTable.risingDemand')}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-700 dark:text-gray-300">
                        {t('pages.whitepaper.marketOpportunity.trendsTable.risingDemandRelevance')}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-700 dark:text-gray-300">
                        {t('pages.whitepaper.marketOpportunity.trendsTable.digitalPayments')}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-700 dark:text-gray-300">
                        {t('pages.whitepaper.marketOpportunity.trendsTable.digitalPaymentsRelevance')}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-700 dark:text-gray-300">
                        {t('pages.whitepaper.marketOpportunity.trendsTable.assetTokenization')}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-700 dark:text-gray-300">
                        {t('pages.whitepaper.marketOpportunity.trendsTable.assetTokenizationRelevance')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('pages.whitepaper.marketOpportunity.conclusion')}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Proposed Solution */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {t('pages.whitepaper.proposedSolution.title')}
          </h2>
          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
                {t('pages.whitepaper.proposedSolution.intro')}
              </p>
              
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                {t('pages.whitepaper.proposedSolution.keyHighlights')}
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <Coins className="w-8 h-8 text-brand-dark-gold dark:text-brand-gold mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {t('pages.whitepaper.proposedSolution.backedTokens.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.proposedSolution.backedTokens.description')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <Users className="w-8 h-8 text-brand-dark-gold dark:text-brand-gold mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {t('pages.whitepaper.proposedSolution.platform.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.proposedSolution.platform.description')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <Shield className="w-8 h-8 text-brand-dark-gold dark:text-brand-gold mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {t('pages.whitepaper.proposedSolution.walletSupport.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.proposedSolution.walletSupport.description')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <Globe className="w-8 h-8 text-brand-dark-gold dark:text-brand-gold mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {t('pages.whitepaper.proposedSolution.digitalExperience.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.proposedSolution.digitalExperience.description')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <FileText className="w-8 h-8 text-brand-dark-gold dark:text-brand-gold mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {t('pages.whitepaper.proposedSolution.adminDashboard.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.proposedSolution.adminDashboard.description')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <Building className="w-8 h-8 text-brand-dark-gold dark:text-brand-gold mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {t('pages.whitepaper.proposedSolution.cantonNetwork.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.proposedSolution.cantonNetwork.description')}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mt-8">
                {t('pages.whitepaper.proposedSolution.conclusion')}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Token Structure */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {t('pages.whitepaper.tokenStructure.title')}
          </h2>
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    G
                  </div>
                  {t('pages.whitepaper.tokenStructure.gld.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('pages.whitepaper.tokenStructure.gld.backedAsset.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.tokenStructure.gld.backedAsset.description')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('pages.whitepaper.tokenStructure.gld.standard.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.tokenStructure.gld.standard.description')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('pages.whitepaper.tokenStructure.gld.features.title')}
                    </h4>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                        {t('pages.whitepaper.tokenStructure.gld.features.redeemable')}
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                        {t('pages.whitepaper.tokenStructure.gld.features.usable')}
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                        {t('pages.whitepaper.tokenStructure.gld.features.transparent')}
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 border-gray-200 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    S
                  </div>
                  {t('pages.whitepaper.tokenStructure.slv.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('pages.whitepaper.tokenStructure.slv.backedAsset.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.tokenStructure.slv.backedAsset.description')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('pages.whitepaper.tokenStructure.slv.standard.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.tokenStructure.slv.standard.description')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('pages.whitepaper.tokenStructure.slv.features.title')}
                    </h4>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                        {t('pages.whitepaper.tokenStructure.slv.features.realValue')}
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                        {t('pages.whitepaper.tokenStructure.slv.features.fullUtility')}
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                        {t('pages.whitepaper.tokenStructure.slv.features.transparent')}
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.whitepaper.tokenStructure.lifecycle.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-brand-dark-gold dark:bg-brand-gold rounded-full flex items-center justify-center text-white font-bold mr-4">
                    1
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {t('pages.whitepaper.tokenStructure.lifecycle.step1')}
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-brand-dark-gold dark:bg-brand-gold rounded-full flex items-center justify-center text-white font-bold mr-4">
                    2
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {t('pages.whitepaper.tokenStructure.lifecycle.step2')}
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-brand-dark-gold dark:bg-brand-gold rounded-full flex items-center justify-center text-white font-bold mr-4">
                    3
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {t('pages.whitepaper.tokenStructure.lifecycle.step3')}
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-brand-dark-gold dark:bg-brand-gold rounded-full flex items-center justify-center text-white font-bold mr-4">
                    4
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {t('pages.whitepaper.tokenStructure.lifecycle.step4')}
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-brand-dark-gold dark:bg-brand-gold rounded-full flex items-center justify-center text-white font-bold mr-4">
                    5
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {t('pages.whitepaper.tokenStructure.lifecycle.step5')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Custody Framework */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {t('pages.whitepaper.custodyFramework.title')}
          </h2>
          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
                {t('pages.whitepaper.custodyFramework.intro')}
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {t('pages.whitepaper.custodyFramework.physicalCustody.title')}
                  </h3>
                  <div className="space-y-3 text-gray-600 dark:text-gray-300">
                    <p><strong>{t('pages.whitepaper.custodyFramework.physicalCustody.assetType.label')}:</strong> {t('pages.whitepaper.custodyFramework.physicalCustody.assetType.description')}</p>
                    <p><strong>{t('pages.whitepaper.custodyFramework.physicalCustody.storagePartners.label')}:</strong> {t('pages.whitepaper.custodyFramework.physicalCustody.storagePartners.description')}</p>
                    <p><strong>{t('pages.whitepaper.custodyFramework.physicalCustody.geographic.label')}:</strong> {t('pages.whitepaper.custodyFramework.physicalCustody.geographic.description')}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">1:1</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{t('pages.whitepaper.custodyFramework.guarantees.assetBacked')}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">24/7</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{t('pages.whitepaper.custodyFramework.guarantees.monitoring')}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">100%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{t('pages.whitepaper.custodyFramework.guarantees.audited')}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">99.9%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{t('pages.whitepaper.custodyFramework.guarantees.uptime')}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <Shield className="w-8 h-8 text-brand-dark-gold dark:text-brand-gold mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {t('pages.whitepaper.custodyFramework.features.guarantee.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.custodyFramework.features.guarantee.description')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <Eye className="w-8 h-8 text-brand-dark-gold dark:text-brand-gold mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {t('pages.whitepaper.custodyFramework.features.audits.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.custodyFramework.features.audits.description')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <TrendingUp className="w-8 h-8 text-brand-dark-gold dark:text-brand-gold mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {t('pages.whitepaper.custodyFramework.features.tracking.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.custodyFramework.features.tracking.description')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <Lock className="w-8 h-8 text-brand-dark-gold dark:text-brand-gold mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {t('pages.whitepaper.custodyFramework.features.logistics.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.custodyFramework.features.logistics.description')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Platform Architecture */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {t('pages.whitepaper.platformArchitecture.title')}
          </h2>
          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
            <CardContent className="p-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
                {t('pages.whitepaper.platformArchitecture.intro')}
              </p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <Zap className="w-8 h-8 text-brand-dark-gold dark:text-brand-gold mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {t('pages.whitepaper.platformArchitecture.smartContracts.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.platformArchitecture.smartContracts.description')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <Users className="w-8 h-8 text-brand-dark-gold dark:text-brand-gold mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {t('pages.whitepaper.platformArchitecture.userDashboard.title')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.whitepaper.platformArchitecture.userDashboard.description')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-brand-dark-gold/5 dark:bg-brand-gold/10 border-brand-dark-gold/20 dark:border-brand-gold/30 inline-block">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t('pages.whitepaper.cta.title')}
              </h2>
              <p className="text-xl text-brand-dark-gold dark:text-brand-gold font-semibold mb-6">
                {t('pages.whitepaper.cta.subtitle')}
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                {t('pages.whitepaper.cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-brand-dark-gold dark:bg-brand-gold text-white hover:bg-brand-dark-gold/90 dark:hover:bg-brand-gold/90 px-8 py-3 text-lg"
                  onClick={() => window.location.href = '/signup'}
                >
                  {t('pages.whitepaper.cta.getStarted')}
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="border-brand-dark-gold text-brand-dark-gold dark:text-brand-gold hover:bg-brand-dark-gold/10 dark:hover:bg-brand-gold/10 px-8 py-3 text-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {t('pages.whitepaper.cta.downloadWhitepaper')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}