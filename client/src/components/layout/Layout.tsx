import { ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { OnboardingKycBanner } from './OnboardingKycBanner';
import { getUserProfile } from '@/api/queries';
import { useAuthStore } from '@/stores/authStore';
import { useKycStatus } from '@/hooks/useKycStatus';

interface LayoutProps {
  children: ReactNode;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export default function Layout({ children, isAuthenticated = false, onLogout }: LayoutProps) {
  const { token, setUser, logout } = useAuthStore();
  
  // Check KYC status for authenticated users
  const { needsKyc, isKycComplete } = useKycStatus(isAuthenticated);

  // Fetch user details when authenticated
  const { data: userResponse, error } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => getUserProfile(token as string),
    enabled: isAuthenticated && !!token,  
    staleTime: 500000, 
  });

  // Update user and wallets in store when profile data is fetched
  useEffect(() => {
    if (userResponse?.user) {
      const wallets = userResponse.wallets || [];
      setUser(userResponse.user, wallets);
    }
  }, [userResponse]);

  // Handle authentication errors (token expired, etc.)
  useEffect(() => {
    if (error && isAuthenticated) {
      console.error('Failed to fetch user profile:', error);
      // If there's an auth error, logout the user
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        logout();
        if (onLogout) {
          onLogout();
        }
      }
    }
  }, [error, isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isAuthenticated={isAuthenticated} onLogout={onLogout} />
      {isAuthenticated && <OnboardingKycBanner />}
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export { Layout };