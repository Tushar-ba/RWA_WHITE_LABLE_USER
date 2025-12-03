import React, { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { Loader2, ExternalLink, CreditCard, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface TransakPaymentProps {
  purchaseHistoryId: string;
  amount: number;
  fiatCurrency: string;
  cryptoCurrency: string;
  walletAddress: string;
  mode: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface TransakSessionResponse {
  sessionId: string;
  redirectUrl: string;
}

export default function TransakPayment({
  purchaseHistoryId,
  amount,
  fiatCurrency,
  cryptoCurrency,
  walletAddress,
  onSuccess,
  mode,
  onCancel
}: TransakPaymentProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionData, setSessionData] = useState<TransakSessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { theme } = useTheme();

  useEffect(() => {
    // Auto-initiate payment session when component mounts
    initiatePayment();
  }, []);

  const initiatePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, get or refresh access token
      const tokenResponse = await axios.post('/api/transak/refresh-token');
      
      if (!tokenResponse.data.success) {
        throw new Error('Failed to authenticate with payment provider');
      }
      console.log("MODEEEEE",mode)
      // Create payment session
      const sessionResponse = await axios.post('/api/transak/create-session', {
        fiatCurrency,
        cryptoCurrency,
        fiatAmount: amount,
        walletAddress,
        purchaseHistoryId,
        mode:mode || 'BUY',
        sessionId:tokenResponse.data.data.access_token
      });

      if (!sessionResponse.data.success) {
        throw new Error(sessionResponse.data.message || 'Failed to create payment session');
      }

      setSessionData(sessionResponse.data.data);
      
      toast({
        title: t('payment.sessionCreated'),
        description: t('payment.redirectingToPayment'),
      });

    } catch (error: any) {
      console.error('Error initiating Transak payment:', error);
      const errorMessage = error?.response?.data?.message || error.message || 'Failed to initiate payment';
      setError(errorMessage);
      
      toast({
        title: t('payment.error'),
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToPayment = () => {
    if (sessionData?.redirectUrl) {
      // Open payment in new window/tab
      const paymentWindow = window.open(
        sessionData.redirectUrl, 
        'transak-payment',
        'width=500,height=700,scrollbars=yes,resizable=yes'
      );

      // Monitor the payment window
      const checkClosed = setInterval(() => {
        if (paymentWindow?.closed) {
          clearInterval(checkClosed);
          
          // Payment window closed - could be success or cancellation
          toast({
            title: t('payment.windowClosed'),
            description: t('payment.checkTransactionStatus'),
          });

          // Call success callback (parent will handle refreshing data)
          if (onSuccess) onSuccess();
        }
      }, 1000);
    }
  };

  const handleRetry = () => {
    setError(null);
    setSessionData(null);
    initiatePayment();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6 sm:p-8">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mr-2 sm:mr-3" />
          <span className="text-sm sm:text-base">{t('payment.initializingPayment')}</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600 dark:text-red-400">
            <CreditCard className="h-5 w-5 mr-2" />
            {t('payment.paymentError')}
          </CardTitle>
          <CardDescription>
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleRetry}
              className="w-full sm:w-auto bg-brand-dark-gold dark:bg-brand-gold text-white hover:bg-brand-dark-gold/90 dark:hover:bg-brand-gold/90 text-sm sm:text-base"
              data-testid="button-retry-payment"
            >
              {t('payment.tryAgain')}
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="w-full sm:w-auto text-sm sm:text-base"
              data-testid="button-go-back"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t('payment.goBack')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            {t('payment.readyToPay')}
          </CardTitle>
          <CardDescription>
            {t('payment.securePaymentReady')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('payment.amount')}</span>
                <div className="font-semibold">{amount} {fiatCurrency}</div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('payment.purchasing')}</span>
                <div className="font-semibold">{cryptoCurrency} {t('payment.tokens')}</div>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-gray-500 dark:text-gray-400">{t('payment.walletAddress')}</span>
                <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border mt-1 break-all overflow-hidden">
                  {walletAddress}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleProceedToPayment}
              className="w-full sm:flex-1 bg-brand-dark-gold dark:bg-brand-gold text-white hover:bg-brand-dark-gold/90 dark:hover:bg-brand-gold/90 text-sm sm:text-base"
              data-testid="button-proceed-payment"
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t('payment.proceedToPayment')}
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="w-full sm:w-auto text-sm sm:text-base"
              data-testid="button-cancel-payment"
            >
              {t('payment.cancel')}
            </Button>
          </div>

          {/* Security Note */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center border-t pt-4">
            {t('payment.secureNote')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}