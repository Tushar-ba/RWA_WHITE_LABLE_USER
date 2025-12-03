import React from 'react';
import Layout from '../components/layout/Layout';
import KycVerification from '../components/KycVerification';
import { useLocation } from 'wouter';

export default function KycVerificationPage() {
  const [, setLocation] = useLocation();

  const handleKycComplete = () => {
    // Navigate to dashboard after KYC completion
    setLocation('/dashboard');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <KycVerification onKycComplete={handleKycComplete} showTitle={true} />
    </div>
  );
}