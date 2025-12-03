import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Clock, Loader2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { contactFormSchema, ContactFormData } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import lightLogoPath from '@assets/WNVaultedAssets_1753707707419.png';
import darkLogoPath from '@assets/VaultedAssets (1)_1753709040936.png';


export default function Contact() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const logoPath = theme === 'dark' ? darkLogoPath : lightLogoPath;
  const { toast } = useToast();
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      subject: '',
      message: ''
    }
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('pages.contact.form.success.title'),
        description: t('pages.contact.form.success.description'),
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t('pages.contact.form.error.title'),
        description: error.message || t('pages.contact.form.error.description'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  // FAQ categories with their questions
  const faqCategories = [
    {
      id: 'general',
      title: t('pages.contact.faq.categories.general.title'),
      questions: ['q1', 'q2', 'q3', 'q4']
    },
    {
      id: 'tokens',
      title: t('pages.contact.faq.categories.tokens.title'),
      questions: ['q5', 'q6', 'q7']
    },
    {
      id: 'buying',
      title: t('pages.contact.faq.categories.buying.title'),
      questions: ['q8', 'q9', 'q10']
    },
    {
      id: 'fees',
      title: t('pages.contact.faq.categories.fees.title'),
      questions: ['q11', 'q12']
    },
    {
      id: 'security',
      title: t('pages.contact.faq.categories.security.title'),
      questions: ['q13', 'q14', 'q15']
    },
    {
      id: 'crossChain',
      title: t('pages.contact.faq.categories.crossChain.title'),
      questions: ['q16', 'q17']
    },
    {
      id: 'audit',
      title: t('pages.contact.faq.categories.audit.title'),
      questions: ['q18', 'q19']
    },
    {
      id: 'wallets',
      title: t('pages.contact.faq.categories.wallets.title'),
      questions: ['q20', 'q21']
    },
    {
      id: 'gifting',
      title: t('pages.contact.faq.categories.gifting.title'),
      questions: ['q22', 'q23']
    },
    {
      id: 'jurisdictional',
      title: t('pages.contact.faq.categories.jurisdictional.title'),
      questions: ['q24', 'q25']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <img 
              src={logoPath}
              alt="Vaulted Assets Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('pages.contact.title')} <span className="text-brand-dark-gold dark:text-brand-gold">{t('pages.contact.titleHighlight')}</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {t('pages.contact.subtitle')}
          </p>
        </div>
       
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 mb-6">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">{t('pages.contact.info.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-brand-brown mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('pages.contact.info.email.title')}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{t('pages.contact.info.email.support')}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{t('pages.contact.info.email.partnerships')}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-brand-brown mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('pages.contact.info.office.title')}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.contact.info.office.address')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-brand-brown mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('pages.contact.info.hours.title')}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {t('pages.contact.info.hours.weekdays')}<br />
                      {t('pages.contact.info.hours.saturday')}<br />
                      {t('pages.contact.info.hours.sunday')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>            
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">{t('pages.contact.form.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">{t('pages.contact.form.fields.firstName')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('pages.contact.form.placeholders.firstName')}
                                {...field}
                                data-testid="input-firstName"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-white">{t('pages.contact.form.fields.lastName')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('pages.contact.form.placeholders.lastName')}
                                {...field}
                                data-testid="input-lastName"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">{t('pages.contact.form.fields.email')}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t('pages.contact.form.placeholders.email')}
                              {...field}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">{t('pages.contact.form.fields.company')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('pages.contact.form.placeholders.company')}
                              {...field}
                              data-testid="input-company"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">{t('pages.contact.form.fields.subject')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('pages.contact.form.placeholders.subject')}
                              {...field}
                              data-testid="input-subject"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-white">{t('pages.contact.form.fields.message')}</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[120px]"
                              placeholder={t('pages.contact.form.placeholders.message')}
                              {...field}
                              data-testid="textarea-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        type="submit"
                        className="bg-brand-brown hover:bg-brand-brown/90 text-white flex-1"
                        disabled={contactMutation.isPending}
                        data-testid="button-submit-contact"
                      >
                        {contactMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('pages.contact.form.buttons.sending')}
                          </>
                        ) : (
                          t('pages.contact.form.buttons.send')
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        className="border-gray-300 dark:border-gray-600"
                        onClick={() => form.reset()}
                        disabled={contactMutation.isPending}
                        data-testid="button-clear-form"
                      >
                        {t('pages.contact.form.buttons.clear')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comprehensive FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-12 h-12 text-brand-dark-gold dark:text-brand-gold" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('pages.contact.faq.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {t('pages.contact.faq.subtitle')}
            </p>
          </div>

          <div className="space-y-8">
            {faqCategories.map((category) => (
              <div key={category.id}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {category.title}
                </h3>
                <div className="grid gap-4">
                  {category.questions.map((questionId) => (
                    <Card key={questionId} className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
                      <Collapsible open={openFAQ === questionId} onOpenChange={() => setOpenFAQ(openFAQ === questionId ? null : questionId)}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                              {t(`pages.contact.faq.questions.${questionId}.question`)}
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
                              {t(`pages.contact.faq.questions.${questionId}.answer`)}
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
        </div>
      </div>
    </div>
  );
}