import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useSmartBack } from "@/hooks/useSmartBack";
import { Cookie, Shield, Settings, Eye, Lock, Globe, AlertCircle, Users } from "lucide-react";

export default function CookiePolicy() {
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
            <Cookie className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {t('pages.cookiePolicy.title')}
          </h1>
          {/* <p className="text-xl text-gray-600 dark:text-gray-300">
            {t('pages.cookiePolicy.effectiveDate')}
          </p> */}
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              {t('pages.cookiePolicy.introduction.text1')}
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('pages.cookiePolicy.introduction.text2')}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Section 1: What Are Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Cookie className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.cookiePolicy.section1.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.cookiePolicy.section1.intro')}
              </p>
              
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.cookiePolicy.section1.types.intro')}
              </p>

              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>{t('pages.cookiePolicy.section1.types.session.title')}</strong> – {t('pages.cookiePolicy.section1.types.session.description')}</li>
                <li><strong>{t('pages.cookiePolicy.section1.types.persistent.title')}</strong> – {t('pages.cookiePolicy.section1.types.persistent.description')}</li>
                <li><strong>{t('pages.cookiePolicy.section1.types.firstParty.title')}</strong> – {t('pages.cookiePolicy.section1.types.firstParty.description')}</li>
                <li><strong>{t('pages.cookiePolicy.section1.types.thirdParty.title')}</strong> – {t('pages.cookiePolicy.section1.types.thirdParty.description')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 2: How We Use Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Settings className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.cookiePolicy.section2.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.cookiePolicy.section2.intro')}
              </p>

              <div className="grid gap-6">
                <div className="flex items-start space-x-4">
                  <Shield className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('pages.cookiePolicy.section2.categories.essential.title')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t('pages.cookiePolicy.section2.categories.essential.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Eye className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('pages.cookiePolicy.section2.categories.performance.title')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {t('pages.cookiePolicy.section2.categories.performance.description')}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm italic">
                      {t('pages.cookiePolicy.section2.categories.performance.example')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Settings className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('pages.cookiePolicy.section2.categories.functionality.title')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t('pages.cookiePolicy.section2.categories.functionality.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Lock className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('pages.cookiePolicy.section2.categories.security.title')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t('pages.cookiePolicy.section2.categories.security.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Users className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('pages.cookiePolicy.section2.categories.marketing.title')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t('pages.cookiePolicy.section2.categories.marketing.description')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Third-Party Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Globe className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.cookiePolicy.section3.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.cookiePolicy.section3.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>{t('pages.cookiePolicy.section3.services.analytics')}</li>
                <li>{t('pages.cookiePolicy.section3.services.advertising')}</li>
                <li>{t('pages.cookiePolicy.section3.services.payment')}</li>
                <li>{t('pages.cookiePolicy.section3.services.blockchain')}</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.cookiePolicy.section3.note')}
              </p>
            </CardContent>
          </Card>

          {/* Section 4: Managing Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.cookiePolicy.section4.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.cookiePolicy.section4.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('pages.cookiePolicy.section4.actions.view')}</li>
                <li>{t('pages.cookiePolicy.section4.actions.delete')}</li>
                <li>{t('pages.cookiePolicy.section4.actions.block')}</li>
                <li>{t('pages.cookiePolicy.section4.actions.blockAll')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 5: Retention Periods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.cookiePolicy.section5.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('pages.cookiePolicy.section5.periods.session.title')}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {t('pages.cookiePolicy.section5.periods.session.description')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('pages.cookiePolicy.section5.periods.persistent.title')}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {t('pages.cookiePolicy.section5.periods.persistent.description')}
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>{t('pages.cookiePolicy.section5.periods.persistent.examples.login')}</li>
                    <li>{t('pages.cookiePolicy.section5.periods.persistent.examples.preference')}</li>
                    <li>{t('pages.cookiePolicy.section5.periods.persistent.examples.analytics')}</li>
                  </ul>
                </div>

                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.cookiePolicy.section5.note')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Jurisdiction-Specific Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.cookiePolicy.section6.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.cookiePolicy.section6.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>{t('pages.cookiePolicy.section6.laws.gdpr.title')}</strong> – {t('pages.cookiePolicy.section6.laws.gdpr.description')}</li>
                <li><strong>{t('pages.cookiePolicy.section6.laws.ccpa.title')}</strong> – {t('pages.cookiePolicy.section6.laws.ccpa.description')}</li>
                <li><strong>{t('pages.cookiePolicy.section6.laws.other.title')}</strong> – {t('pages.cookiePolicy.section6.laws.other.description')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 7: User Rights & Choices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.cookiePolicy.section7.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-3">
                <li>{t('pages.cookiePolicy.section7.rights.adjust')}</li>
                <li>{t('pages.cookiePolicy.section7.rights.essential')}</li>
                <li>{t('pages.cookiePolicy.section7.rights.rejecting')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 8: Your Consent */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <AlertCircle className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.cookiePolicy.section8.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.cookiePolicy.section8.description')}
              </p>
            </CardContent>
          </Card>

          {/* Section 9: Updates to This Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.cookiePolicy.section9.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.cookiePolicy.section9.description')}
              </p>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.cookiePolicy.contact.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {t('pages.cookiePolicy.contact.description')}
              </p>
              <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.cookiePolicy.contact.info')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}