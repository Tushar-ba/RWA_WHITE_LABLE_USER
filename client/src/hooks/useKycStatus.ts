import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import axios from '../lib/axios';

export function useKycStatus(isAuthenticated: boolean) {
  const [, setLocation] = useLocation();

  // Fetch KYC status when user is authenticated
  const { data: kycStatus, isLoading } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: async () => {
      const response = await axios.get('/api/kyc/status');
      return response.data;
    },
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes
  });

  // Check if user needs KYC verification
  const needsKyc = kycStatus && (
    kycStatus.kycStatus === 'not_started' || 
    kycStatus.kycStatus === 'rejected'
  );

  const isKycComplete = kycStatus && kycStatus.kycStatus === 'approved';
  const isKycPending = kycStatus && (
    kycStatus.kycStatus === 'pending' || 
    kycStatus.kycStatus === 'review'
  );

  // Auto-redirect to onboarding (KYC step) if needed (except if already on onboarding page)
  useEffect(() => {
    if (isAuthenticated && needsKyc && !isLoading) {
      const currentPath = window.location.pathname;
      
      // Don't redirect if user is already on onboarding page or auth pages
      if (!currentPath.includes('/onboarding') && 
          !currentPath.includes('/login') && 
          !currentPath.includes('/signup')) {
        console.log('🚨 KYC required - redirecting to onboarding page');
        setLocation('/onboarding');
      }
    }
  }, [isAuthenticated, needsKyc, isLoading, setLocation]);

  return {
    kycStatus: kycStatus?.kycStatus,
    needsKyc,
    isKycComplete,
    isKycPending,
    isLoading,
    applicantId: kycStatus?.applicantId,
    submissionDate: kycStatus?.submissionDate,
    approvalDate: kycStatus?.approvalDate,
    rejectionReason: kycStatus?.rejectionReason
  };
}