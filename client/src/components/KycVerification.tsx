import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';
import axios from '../lib/axios';
import { useAuthStore } from '../stores/authStore';

interface KycStatus {
  kycStatus: 'not_started' | 'pending' | 'approved' | 'rejected' | 'review';
  applicantId?: string;
  submissionDate?: string;
  approvalDate?: string;
  rejectionReason?: string;
}

interface KycConfig {
  enabled: boolean;
  environment: 'sandbox' | 'production';
}

interface KycVerificationProps {
  onKycComplete?: () => void;
  showTitle?: boolean;
}

export default function KycVerification({ onKycComplete, showTitle = true }: KycVerificationProps) {
  const { user } = useAuthStore();
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSdk, setShowSdk] = useState(false);
  const [userType, setUserType] = useState<'individual' | 'institutional'>(
    (user?.account_type || user?.userType || 'individual') as 'individual' | 'institutional'
  );
  const [levelName, setLevelName] = useState<string>('id-and-liveness');

  useEffect(() => {
    fetchKycStatus();
  }, []);

  // Update userType when user changes
  useEffect(() => {
    if (user) {
      const type = (user.account_type || user.userType || 'individual') as 'individual' | 'institutional';
      setUserType(type);
    }
  }, [user]);

  // Auto-generate external link for first-time users (removed to avoid auto-trigger)
  // Users will now manually click the button

  const fetchKycStatus = async () => {
    try {
      const response = await axios.get('/api/kyc/status');
      if (response.data.success) {
        setKycStatus(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching KYC status:', error);
      setError('Failed to fetch KYC status');
    }
  };



  const startKycVerification = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate access token from backend (no body needed, user info from JWT)
      const response = await axios.post('/api/kyc/access-token');
      console.log("res",response)
      if (response.data.success) {
        const accessToken = response.data.accessToken;
        const responseUserType = response.data.userType || 'individual';
        const responseLevelName = response.data.levelName || 'id-and-liveness';
        
        // Store user type and level name for display
        setUserType(responseUserType);
        setLevelName(responseLevelName);
        
        console.log(`[KYC] User type: ${responseUserType}, Level: ${responseLevelName}`);
        
        if (accessToken) {
          setAccessToken(accessToken);
          setShowSdk(true); // Show container FIRST
          
          // Wait for React to render the container, then initialize WebSDK
          setTimeout(() => {
            initializeSumsubSDK(accessToken);
          }, 100);
        } else {
          throw new Error('No access token received');
        }
      } else {
        throw new Error(response.data.message || 'Failed to generate access token');
      }
    } catch (error: any) {
      console.error('Error starting KYC verification:', error);
      setError(error.response?.data?.message || 'Failed to start KYC verification');
    } finally {
      setLoading(false);
    }
  };

  const initializeSumsubSDK = (accessToken: string) => {
    try {
      console.log('🔍 Checking WebSDK availability...');
      console.log('Window object:', typeof window !== 'undefined');
      console.log('snsWebSdk available:', !!(window as any).snsWebSdk);

      if (typeof window !== 'undefined' && (window as any).snsWebSdk) {
        const snsWebSdk = (window as any).snsWebSdk;

        console.log('✅ Sumsub WebSDK found, initializing...');
        console.log('🎫 Access token (first 20 chars):', accessToken.substring(0, 20) + '...');

        const container = document.getElementById('sumsub-websdk-container');
        console.log('📦 Container element found:', !!container);

        if (!container) {
          console.error('❌ Container element #sumsub-websdk-container not found');
          setError('SDK container not found. Please refresh the page.');
          return;
        }

        const snsWebSdkInstance = snsWebSdk
          .init(
            accessToken,
            () => getNewAccessToken()
          )
          .withConf({
            lang: "en"
          })
          .withOptions({
            addViewportTag: false,
            adaptIframeHeight: true
          })
          // ✅ Correct event names from Sumsub docs
          .on("idCheck.onStepCompleted", (payload: any) => {
            console.log("✅ KYC Step completed:", payload);
            setShowSdk(false);

            // Update KYC status in database immediately
            updateKycStatusAfterSubmission();
            fetchKycStatus();

            if (onKycComplete) {
              onKycComplete();
            }
          })
          .on("idCheck.onError", (error: any) => {
            console.error("❌ KYC Error:", error);
            setError('KYC verification failed. Please try again.');
            setShowSdk(false);
          })
          .on("idCheck.onInitialized", () => {
            console.log("🎉 KYC SDK initialized successfully");
          })
          .build();

        console.log('🚀 Launching WebSDK...');
        snsWebSdkInstance.launch("#sumsub-websdk-container");

      } else {
        console.error('❌ Sumsub WebSDK script not loaded');
        setError('Sumsub WebSDK script not loaded. Please refresh the page and try again.');
      }
    } catch (error) {
      console.error('💥 Error initializing Sumsub SDK:', error);
      setError('Failed to initialize KYC verification. Please try again.');
    }
  };

  const getNewAccessToken = async () => {
    try {
      const response = await axios.post('/api/kyc/access-token');
      return response.data.accessToken;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw new Error('Failed to refresh access token');
    }
  };

  const updateKycStatusAfterSubmission = async () => {
    try {
      // Update user's KYC status to 'pending' after submission
      await axios.patch('/api/users/me', {
        kyc_status: 'approved',
        kyc_submission_date: new Date().toISOString()
      });
      console.log('✅ KYC status updated to approved');
    } catch (error) {
      console.error('Failed to update KYC status:', error);
    }
  };

  const handleSdkMessage = (type: string, payload: any) => {
    console.log('Sumsub SDK message:', type, payload);
    
    // Handle different message types
    switch (type) {
      case 'idCheck.onReady':
        console.log('KYC SDK is ready');
        break;
      case 'idCheck.onSubmitted':
        console.log('KYC submitted');
        setShowSdk(false);
        fetchKycStatus(); // Refresh status
        if (onKycComplete) {
          onKycComplete();
        }
        break;
      case 'idCheck.onError':
        console.error('KYC SDK error:', payload);
        setError('KYC verification failed. Please try again.');
        break;
    }
  };

  const handleSdkError = (error: any) => {
    console.error('Sumsub SDK error:', error);
    setError('KYC verification encountered an error. Please try again.');
    setShowSdk(false);
  };

  const accessTokenExpirationHandler = async () => {
    // Get new access token when current one expires
    try {
      const response = await axios.get('/api/kyc/access-token');
      if (response.data.success) {
        return response.data.accessToken;
      }
    } catch (error) {
      console.error('Failed to refresh access token:', error);
    }
    return null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
      case 'review':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusMessage = (status: string) => {
    const isCompany = userType === 'institutional';
    
    switch (status) {
      case 'approved':
        return isCompany 
          ? 'Your company has been verified successfully. You can now access all platform features.'
          : 'Your identity has been verified successfully. You can now access all platform features.';
      case 'pending':
        return isCompany
          ? "Your company verification is pending. Please complete your KYC. If you've already done so, it's currently under review and usually takes 1–2 business days."
          : "Your verification is pending. Please complete your KYC. If you've already done so, it's currently under review and usually takes 1–2 business days.";
      case 'review':
        return isCompany
          ? 'Your company verification requires additional review. Our team will contact you if needed.'
          : 'Your verification requires additional review. Our team will contact you if needed.';
      case 'rejected':
        return isCompany
          ? 'Your company verification was not successful. Please contact support for assistance.'
          : 'Your verification was not successful. Please contact support for assistance.';
      case 'not_started':
        return isCompany
          ? 'Complete company verification to access investment and redemption features.'
          : 'Complete identity verification to access investment and redemption features.';
      default:
        return 'Unknown verification status.';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
      case 'review':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!kycStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(kycStatus.kycStatus)}
              {userType === 'institutional' ? 'Company Verification' : 'Identity Verification'}
            </CardTitle>
            <CardDescription>
              {userType === 'institutional' 
                ? 'Complete your company verification to access all platform features including investments, token minting, and redemptions.'
                : 'Complete your identity verification to access all platform features including investments, token minting, and redemptions.'
              }
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={!showTitle ? 'pt-6' : ''}>
          <Alert className={getStatusColor(kycStatus.kycStatus)}>
            <AlertDescription className="flex items-center gap-2">
              {getStatusIcon(kycStatus.kycStatus)}
              {getStatusMessage(kycStatus.kycStatus)}
            </AlertDescription>
          </Alert>

          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {(kycStatus.kycStatus === 'not_started' || kycStatus.kycStatus === 'pending' || kycStatus.kycStatus === 'review') && (
            <div className="mt-4">
              <Button 
                onClick={startKycVerification} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Initializing...' : 
                 kycStatus.kycStatus === 'not_started' 
                   ? (userType === 'institutional' ? 'Start Company Verification' : 'Start KYC Verification')
                   : (userType === 'institutional' ? 'Continue Company Verification' : 'Continue KYC Verification')}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                {userType === 'institutional' 
                  ? 'Complete your company verification to access all features'
                  : 'Complete your identity verification to access all features'
                }
              </p>
            </div>
          )}

          {kycStatus.kycStatus === 'rejected' && kycStatus.rejectionReason && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">
                <strong>Rejection reason:</strong> {kycStatus.rejectionReason}
              </p>
            </div>
          )}

          {kycStatus.submissionDate && (
            <div className="mt-4 text-sm text-gray-600">
              {/* <p>Submitted: {new Date(kycStatus.submissionDate).toLocaleDateString()}</p> */}
              {kycStatus.approvalDate && (
                <p>Approved: {new Date(kycStatus.approvalDate).toLocaleDateString()}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sumsub WebSDK Container */}
      {showSdk && accessToken && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {userType === 'institutional' ? 'Complete Your Company Verification' : 'Complete Your Verification'}
            </h3>
            <div id="sumsub-websdk-container" style={{ minHeight: '500px', width: '100%' }}></div>
          </CardContent>
        </Card>
      )}
      
      {/* Debug information */}
      {/* {accessToken && !showSdk && (
        <Card className="mt-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">
              🔄 WebSDK is initializing... If this takes too long, please refresh the page.
            </p>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
}