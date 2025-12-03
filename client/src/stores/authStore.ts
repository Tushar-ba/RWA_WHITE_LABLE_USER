import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Wallet {
  _id?: string;
  userId: string;
  address: string;
  type: string;
  label?: 'primary' | 'secondary';
  createdAt: string;
}

interface User {
  user_id: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  phone_number?: string;
  organization_name?: string;
  country?: string;
  state?: string;
  account_status: string;
  email_verified?: boolean;
  referral_code?: string;
  terms_accepted?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  kyc_status?: 'not_started' | 'pending' | 'approved' | 'rejected' | 'review';
  isOnboarded?: boolean;
  account_type?: 'individual' | 'institutional';
  userType?: 'individual' | 'institutional';
  // Personal info
  address1?: string;
  address2?: string;
  city?: string;
  zipcode?: string;
  dob?: string;
  profession?: string;
  // Account profile
  purpose_of_account?: string;
  expected_transaction_activity?: string;
  // Institutional fields
  company_name?: string;
  registration_id?: string;
  company_website?: string;
  company_phone?: string;
  business_address1?: string;
  business_address2?: string;
  business_city?: string;
  business_country?: string;
  business_state?: string;
  business_zipcode?: string;
  authorized_signatory_name?: string;
  authorized_signatory_email?: string;
  authorized_signatory_phone?: string;
}

interface AuthState {
  // Auth state
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  wallets: Wallet[];
  
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User, wallets?: Wallet[]) => void;
  setWallets: (wallets: Wallet[]) => void;
  updateToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      isAuthenticated: false,
      token: null,
      user: null,
      wallets: [],

      // Actions
      login: (token: string, user: User) => {
        set({
          isAuthenticated: true,
          token,
          user,
          wallets: [], // Reset wallets on login, will be loaded from /me endpoint
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          token: null,
          user: null,
          wallets: [],
        });
      },

      setUser: (user: User, wallets?: Wallet[]) => {
        set((state) => ({
          ...state,
          user,
          ...(wallets !== undefined && { wallets }),
        }));
      },

      setWallets: (wallets: Wallet[]) => {
        set((state) => ({
          ...state,
          wallets,
        }));
      },

      updateToken: (token: string) => {
        set((state) => ({
          ...state,
          token,
        }));
      },
    }),
    {
      name: 'auth-storage', // Storage key in localStorage
      partialize: (state) => ({
        // Only persist these fields
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        // user: state.user,
        // wallets: state.wallets,
      }),
    }
  )
);