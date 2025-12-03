import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSmartBack } from "@/hooks/useSmartBack";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function FAQ() {
  const { t } = useTranslation();
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const { goBack } = useSmartBack();

  // FAQ categories with their questions
  const faqCategories = [
    {
      id: 'general',
      title: t('pages.faq.categories.general.title'),
      questions: ['q1', 'q2', 'q3', 'q4']
    },
    {
      id: 'tokens',
      title: t('pages.faq.categories.tokens.title'),
      questions: ['q5', 'q6', 'q7']
    },
    {
      id: 'buying',
      title: t('pages.faq.categories.buying.title'),
      questions: ['q8', 'q9', 'q10']
    },
    {
      id: 'fees',
      title: t('pages.faq.categories.fees.title'),
      questions: ['q11', 'q12']
    },
    {
      id: 'security',
      title: t('pages.faq.categories.security.title'),
      questions: ['q13', 'q14', 'q15']
    },
    {
      id: 'crossChain',
      title: t('pages.faq.categories.crossChain.title'),
      questions: ['q16', 'q17']
    },
    {
      id: 'audit',
      title: t('pages.faq.categories.audit.title'),
      questions: ['q18', 'q19']
    },
    {
      id: 'wallets',
      title: t('pages.faq.categories.wallets.title'),
      questions: ['q20', 'q21']
    },
    {
      id: 'gifting',
      title: t('pages.faq.categories.gifting.title'),
      questions: ['q22', 'q23']
    },
    {
      id: 'jurisdictional',
      title: t('pages.faq.categories.jurisdictional.title'),
      questions: ['q24', 'q25']
    }
  ];

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
            <HelpCircle className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {t('pages.faq.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {t('pages.faq.subtitle')}
          </p>
        </div>

        <div className="space-y-12">
          {faqCategories.map((category) => (
            <div key={category.id}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {category.title}
              </h2>
              <div className="grid gap-4">
                {category.questions.map((questionId) => (
                  <Card key={questionId} className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
                    <Collapsible open={openFAQ === questionId} onOpenChange={() => setOpenFAQ(openFAQ === questionId ? null : questionId)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                            {t(`pages.faq.questions.${questionId}.question`)}
                            {openFAQ === questionId ? (
                              <ChevronUp className="w-5 h-5 text-brand-dark-gold dark:text-brand-gold" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-brand-dark-gold dark:text-brand-gold" />
                            )}
                          </CardTitle>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {t(`pages.faq.questions.${questionId}.answer`)}
                          </p>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('pages.faq.stillHaveQuestions.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {t('pages.faq.stillHaveQuestions.description')}
              </p>
              <Button 
                className="bg-brand-dark-gold dark:bg-brand-gold text-white hover:bg-brand-dark-gold/90 dark:hover:bg-brand-gold/90"
                onClick={() => window.location.href = '/contact'}
              >
                {t('pages.faq.contactSupport')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}