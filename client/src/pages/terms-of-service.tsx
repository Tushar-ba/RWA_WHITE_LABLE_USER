import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useSmartBack } from "@/hooks/useSmartBack";
import { Shield, Scale, Lock, Users, FileText, Award, AlertTriangle, Monitor, Globe, Mail } from "lucide-react";

export default function TermsOfService() {
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
            {t('pages.termsOfService.title')}
          </h1>
          {/* <p className="text-xl text-gray-600 dark:text-gray-300">
            {t('pages.termsOfService.effectiveDate')}
          </p> */}
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('pages.termsOfService.introduction')}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Section 1: Purpose */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <FileText className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.termsOfService.section1.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.termsOfService.section1.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('pages.termsOfService.section1.objectives.protection')}</li>
                <li>{t('pages.termsOfService.section1.objectives.integrity')}</li>
                <li>{t('pages.termsOfService.section1.objectives.compliance')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 2: Security Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Lock className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.termsOfService.section2.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.termsOfService.section2.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>{t('pages.termsOfService.section2.objectives.assetProtection.title')}</strong> – {t('pages.termsOfService.section2.objectives.assetProtection.description')}</li>
                <li><strong>{t('pages.termsOfService.section2.objectives.dataConfidentiality.title')}</strong> – {t('pages.termsOfService.section2.objectives.dataConfidentiality.description')}</li>
                <li><strong>{t('pages.termsOfService.section2.objectives.transactionIntegrity.title')}</strong> – {t('pages.termsOfService.section2.objectives.transactionIntegrity.description')}</li>
                <li><strong>{t('pages.termsOfService.section2.objectives.systemResilience.title')}</strong> – {t('pages.termsOfService.section2.objectives.systemResilience.description')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 3: Scope */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.termsOfService.section3.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.termsOfService.section3.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('pages.termsOfService.section3.applies.employees')}</li>
                <li>{t('pages.termsOfService.section3.applies.accounts')}</li>
                <li>{t('pages.termsOfService.section3.applies.assets')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 4: Security Measures */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Shield className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.termsOfService.section4.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 4.1 Custodial Asset Security */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.termsOfService.section4.custodial.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section4.custodial.description')}
                </p>
              </div>

              {/* 4.2 Blockchain Security */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.termsOfService.section4.blockchain.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {t('pages.termsOfService.section4.blockchain.description')}
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>{t('pages.termsOfService.section4.blockchain.features.standards')}</li>
                  <li>{t('pages.termsOfService.section4.blockchain.features.audits')}</li>
                  <li>{t('pages.termsOfService.section4.blockchain.features.monitoring')}</li>
                </ul>
              </div>

              {/* 4.3 Smart Contract Audits */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.termsOfService.section4.smartContracts.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section4.smartContracts.description')}
                </p>
              </div>

              {/* 4.4 Wallet Infrastructure */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.termsOfService.section4.wallet.title')}
                </h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>{t('pages.termsOfService.section4.wallet.features.support')}</li>
                  <li>{t('pages.termsOfService.section4.wallet.features.multiSig')}</li>
                  <li>{t('pages.termsOfService.section4.wallet.features.coldStorage')}</li>
                </ul>
              </div>

              {/* 4.5 Data Protection */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.termsOfService.section4.dataProtection.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section4.dataProtection.description')}
                </p>
              </div>

              {/* 4.6 User-Specific Protections */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.termsOfService.section4.userProtections.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section4.userProtections.description')}
                </p>
              </div>

              {/* 4.7 Custody, Fees & Redemption Security */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.termsOfService.section4.custodyFees.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section4.custodyFees.description')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Compliance Measures */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Scale className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.termsOfService.section5.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.termsOfService.section5.regulatory.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section5.regulatory.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.termsOfService.section5.audit.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section5.audit.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.termsOfService.section5.dataCompliance.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section5.dataCompliance.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('pages.termsOfService.section5.certifications.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {t('pages.termsOfService.section5.certifications.intro')}
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                  <li><strong>{t('pages.termsOfService.section5.certifications.iso.title')}</strong> – {t('pages.termsOfService.section5.certifications.iso.description')}</li>
                  <li><strong>{t('pages.termsOfService.section5.certifications.soc.title')}</strong> – {t('pages.termsOfService.section5.certifications.soc.description')}</li>
                  <li><strong>{t('pages.termsOfService.section5.certifications.aml.title')}</strong> – {t('pages.termsOfService.section5.certifications.aml.description')}</li>
                  <li><strong>{t('pages.termsOfService.section5.certifications.smartContract.title')}</strong> – {t('pages.termsOfService.section5.certifications.smartContract.description')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Incident Response Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.termsOfService.section6.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('pages.termsOfService.section6.intro')}
              </p>
              <ol className="list-decimal pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>{t('pages.termsOfService.section6.steps.detection.title')}</strong> {t('pages.termsOfService.section6.steps.detection.description')}</li>
                <li><strong>{t('pages.termsOfService.section6.steps.containment.title')}</strong> {t('pages.termsOfService.section6.steps.containment.description')}</li>
                <li><strong>{t('pages.termsOfService.section6.steps.notification.title')}</strong> {t('pages.termsOfService.section6.steps.notification.description')}</li>
                <li><strong>{t('pages.termsOfService.section6.steps.remediation.title')}</strong> {t('pages.termsOfService.section6.steps.remediation.description')}</li>
              </ol>
            </CardContent>
          </Card>

          {/* Section 7: Employee & Vendor Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Users className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.termsOfService.section7.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('pages.termsOfService.section7.measures.training')}</li>
                <li>{t('pages.termsOfService.section7.measures.background')}</li>
                <li>{t('pages.termsOfService.section7.measures.vendor')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 8: Independent Audits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Award className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.termsOfService.section8.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.termsOfService.section8.quarterly.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section8.quarterly.description')}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.termsOfService.section8.annual.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section8.annual.description')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.termsOfService.section8.ongoing.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section8.ongoing.description')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 9: Scalability and Emerging Risks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Globe className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.termsOfService.section9.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.termsOfService.section9.environmental.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section9.environmental.description')}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.termsOfService.section9.multiRegion.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section9.multiRegion.description')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.termsOfService.section9.emergingRisk.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section9.emergingRisk.description')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 10: Metrics and Reporting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Monitor className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.termsOfService.section10.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.termsOfService.section10.security.title')}
                </h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>{t('pages.termsOfService.section10.security.uptime')}</li>
                  <li>{t('pages.termsOfService.section10.security.response')}</li>
                  <li>{t('pages.termsOfService.section10.security.remediation')}</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('pages.termsOfService.section10.transparency.title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.section10.transparency.description')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 11: Policy Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('pages.termsOfService.section11.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {t('pages.termsOfService.section11.description')}
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Mail className="w-6 h-6 mr-3 text-brand-dark-gold dark:text-brand-gold" />
                {t('pages.termsOfService.contact.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {t('pages.termsOfService.contact.description')}
              </p>
              <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  {t('pages.termsOfService.contact.info')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}