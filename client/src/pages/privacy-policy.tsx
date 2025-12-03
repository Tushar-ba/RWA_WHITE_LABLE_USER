import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useSmartBack } from "@/hooks/useSmartBack";
import { Shield, Lock, FileText, Users, AlertTriangle, Gavel } from "lucide-react";

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const { goBack } = useSmartBack();

  return (
    <div className="min-h-screen bg-white dark:bg-black py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={goBack}
            className="border-brand-dark-gold text-brand-dark-gold dark:text-brand-gold hover:bg-brand-gold/5"
          >
            ← {t('common.back')}
          </Button>
        </div>

        <div className="text-center mb-16">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {t('pages.privacyPolicy.title')}
          </h1>
          {/* <p className="text-xl text-gray-600 dark:text-gray-300">
            {t('pages.privacyPolicy.effectiveDate')}
          </p> */}
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              {t('pages.privacyPolicy.introduction.text1')}
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('pages.privacyPolicy.introduction.text2')}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Section 1: Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <FileText className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.privacyPolicy.section1.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.privacyPolicy.section1.intro')}
              </p>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.privacyPolicy.section1.personal.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.privacyPolicy.section1.personal.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.privacyPolicy.section1.financial.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.privacyPolicy.section1.financial.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.privacyPolicy.section1.blockchain.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.privacyPolicy.section1.blockchain.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.privacyPolicy.section1.institutional.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.privacyPolicy.section1.institutional.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.privacyPolicy.section1.technical.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.privacyPolicy.section1.technical.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.privacyPolicy.section1.usage.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.privacyPolicy.section1.usage.description')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Users className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.privacyPolicy.section2.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.privacyPolicy.section2.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('pages.privacyPolicy.section2.uses.provide')}</li>
                <li>{t('pages.privacyPolicy.section2.uses.verify')}</li>
                <li>{t('pages.privacyPolicy.section2.uses.improve')}</li>
                <li>{t('pages.privacyPolicy.section2.uses.enable')}</li>
                <li>{t('pages.privacyPolicy.section2.uses.conduct')}</li>
                <li>{t('pages.privacyPolicy.section2.uses.support')}</li>
                <li>{t('pages.privacyPolicy.section2.uses.meet')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 3: Legal Basis for Processing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Gavel className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.privacyPolicy.section3.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.privacyPolicy.section3.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>{t('pages.privacyPolicy.section3.bases.contract.title')}</strong> – {t('pages.privacyPolicy.section3.bases.contract.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section3.bases.legal.title')}</strong> – {t('pages.privacyPolicy.section3.bases.legal.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section3.bases.legitimate.title')}</strong> – {t('pages.privacyPolicy.section3.bases.legitimate.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section3.bases.consent.title')}</strong> – {t('pages.privacyPolicy.section3.bases.consent.description')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 4: Data Sharing and Third-Party Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.privacyPolicy.section4.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.privacyPolicy.section4.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-3">
                <li><strong>{t('pages.privacyPolicy.section4.cases.blockchain.title')}</strong> {t('pages.privacyPolicy.section4.cases.blockchain.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section4.cases.fiat.title')}</strong> {t('pages.privacyPolicy.section4.cases.fiat.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section4.cases.wallets.title')}</strong> {t('pages.privacyPolicy.section4.cases.wallets.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section4.cases.analytics.title')}</strong> {t('pages.privacyPolicy.section4.cases.analytics.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section4.cases.legal.title')}</strong> {t('pages.privacyPolicy.section4.cases.legal.description')}</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4 font-semibold">
                {t('pages.privacyPolicy.section4.noSale')}
              </p>
            </CardContent>
          </Card>

          {/* Section 5: Data Storage & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Lock className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.privacyPolicy.section5.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-3">
                <li><strong>{t('pages.privacyPolicy.section5.measures.encryption.title')}</strong> {t('pages.privacyPolicy.section5.measures.encryption.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section5.measures.access.title')}</strong> {t('pages.privacyPolicy.section5.measures.access.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section5.measures.backups.title')}</strong> {t('pages.privacyPolicy.section5.measures.backups.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section5.measures.physical.title')}</strong> {t('pages.privacyPolicy.section5.measures.physical.description')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 6: Data Security and Breach Notification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.privacyPolicy.section6.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.privacyPolicy.section6.protocols')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.privacyPolicy.section6.breachIntro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('pages.privacyPolicy.section6.breachSteps.users')}</li>
                <li>{t('pages.privacyPolicy.section6.breachSteps.authorities')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 7: Cookies, Tracking, and Opt-Outs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.privacyPolicy.section7.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.privacyPolicy.section7.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li><strong>{t('pages.privacyPolicy.section7.types.essential.title')}</strong> {t('pages.privacyPolicy.section7.types.essential.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section7.types.performance.title')}</strong> {t('pages.privacyPolicy.section7.types.performance.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section7.types.referral.title')}</strong> {t('pages.privacyPolicy.section7.types.referral.description')}</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>{t('pages.privacyPolicy.section7.optOut.title')}</strong> {t('pages.privacyPolicy.section7.optOut.description')}
              </p>
            </CardContent>
          </Card>

          {/* Section 8: Children's Privacy and Sensitive Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.privacyPolicy.section8.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.privacyPolicy.section8.children')}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.privacyPolicy.section8.sensitive')}
              </p>
            </CardContent>
          </Card>

          {/* Section 9: International Data Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.privacyPolicy.section9.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.privacyPolicy.section9.description')}
              </p>
            </CardContent>
          </Card>

          {/* Section 10: Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.privacyPolicy.section10.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.privacyPolicy.section10.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('pages.privacyPolicy.section10.periods.account')}</li>
                <li>{t('pages.privacyPolicy.section10.periods.regulations')}</li>
                <li>{t('pages.privacyPolicy.section10.periods.legal')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 11: Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.privacyPolicy.section11.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.privacyPolicy.section11.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li><strong>{t('pages.privacyPolicy.section11.rights.access.title')}</strong> {t('pages.privacyPolicy.section11.rights.access.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section11.rights.correct.title')}</strong> {t('pages.privacyPolicy.section11.rights.correct.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section11.rights.delete.title')}</strong> {t('pages.privacyPolicy.section11.rights.delete.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section11.rights.restrict.title')}</strong> {t('pages.privacyPolicy.section11.rights.restrict.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section11.rights.object.title')}</strong> {t('pages.privacyPolicy.section11.rights.object.description')}</li>
                <li><strong>{t('pages.privacyPolicy.section11.rights.portability.title')}</strong> {t('pages.privacyPolicy.section11.rights.portability.description')}</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.privacyPolicy.section11.contact')}
              </p>
            </CardContent>
          </Card>

          {/* Section 12: Updates to This Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.privacyPolicy.section12.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.privacyPolicy.section12.description')}
              </p>
            </CardContent>
          </Card>

          {/* Links to Other Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.privacyPolicy.links.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('pages.privacyPolicy.links.terms')}</li>
                <li>{t('pages.privacyPolicy.links.cookie')}</li>
                <li>{t('pages.privacyPolicy.links.security')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.privacyPolicy.contact.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {t('pages.privacyPolicy.contact.description')}
              </p>
              <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.privacyPolicy.contact.info')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}