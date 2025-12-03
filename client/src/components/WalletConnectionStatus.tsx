import { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  LogIn,
  Clock
} from 'lucide-react';

export function WalletConnectionStatus() {
  const { address, isConnected } = useAppKitAccount();
  const { isAuthenticated, token, user } = useAuthStore();
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { t } = useTranslation();

  // Reset connection attempts when wallet connects successfully
  useEffect(() => {
    if (isConnected && address) {
      setConnectionAttempts(0);
    }
  }, [isConnected, address]);

  // Check if token might be expired (basic heuristic)
  const isTokenLikelyExpired = () => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      return now > exp;
    } catch {
      return false;
    }
  };

  const getConnectionStatus = () => {
    if (!isAuthenticated) {
      return {
        status: 'not_authenticated',
        title: t('toasts.authenticationRequired'),
        description: t('toasts.loginRequired'),
        icon: LogIn,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800'
      };
    }

    if (isTokenLikelyExpired()) {
      return {
        status: 'token_expired',
        title: t('toasts.sessionExpired'),
        description: t('toasts.sessionExpiredDesc'),
        icon: Clock,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-950',
        borderColor: 'border-orange-200 dark:border-orange-800'
      };
    }

    if (!isConnected || !address) {
      return {
        status: 'not_connected',
        title: t('navigation.connectWallet'),
        description: t('toasts.connectWalletDesc'),
        icon: Wallet,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        borderColor: 'border-blue-200 dark:border-blue-800'
      };
    }

    return {
      status: 'connected',
      title: t('toasts.walletConnected'),
      description: `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800'
    };
  };

  const status = getConnectionStatus();
  const Icon = status.icon;

  const handleRetryConnection = () => {
    setConnectionAttempts(prev => prev + 1);
    window.location.reload();
  };

  const handleGoToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <Card className={`${status.bgColor} ${status.borderColor} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className={`h-4 w-4 ${status.color}`} />
          {status.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {status.description}
        </p>

        {status.status === 'not_authenticated' && (
          <Button onClick={handleGoToLogin} size="sm" className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            Go to Login
          </Button>
        )}

        {status.status === 'token_expired' && (
          <Button onClick={handleGoToLogin} size="sm" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Login Again
          </Button>
        )}

        {status.status === 'not_connected' && connectionAttempts > 0 && (
          <Alert className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Having trouble connecting? Try refreshing the page or checking your wallet extension.
            </AlertDescription>
          </Alert>
        )}

        {status.status === 'connected' && user && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>User: {user.email}</p>
            <p>Ready for blockchain transfers</p>
          </div>
        )}

        {/* Connection troubleshooting for repeated failures */}
        {connectionAttempts > 2 && status.status !== 'connected' && (
          <Alert className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Still having issues?</strong>
              <br />
              1. Make sure your wallet extension is unlocked
              <br />
              2. Try clearing your browser cache
              <br />
              3. Ensure you're on the correct network
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}