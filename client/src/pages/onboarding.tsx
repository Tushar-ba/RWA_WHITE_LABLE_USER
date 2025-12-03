import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { onboardingSchema, type OnboardingData } from "@shared/schema";
import { StepPersonalInfo } from "@/components/onboarding/StepPersonalInfo";
import { StepBusinessInfo } from "@/components/onboarding/StepBusinessInfo";
import { StepAccountProfile } from "@/components/onboarding/StepAccountProfile";
import { StepKYC } from "@/components/onboarding/StepKYC";
import { RadioGroup } from "@/components/onboarding/RadioGroup";
import { useAuthStore } from "@/stores/authStore";
import axios from "@/lib/axios";
import { useTranslation } from "react-i18next";
import { Stepper } from "react-form-stepper";
import { useTheme } from "@/contexts/ThemeContext";

const STEPS = {
  ACCOUNT_TYPE: 1,
  PERSONAL_INFO: 2,
  BUSINESS_INFO: 3,
  ACCOUNT_PROFILE: 4,
  KYC: 5,
};

const STEP_NAMES = {
  1: "Account Type",
  2: "Personal Info",
  3: "Business Info",
  4: "Account Profile",
  5: "KYC Verification",
};

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [isAlreadyOnboarded, setIsAlreadyOnboarded] = useState(false);
  
  // Use ref to track if data has been fetched to prevent multiple API calls
  const hasFetchedData = useRef(false);
  
  // Save current step to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('onboarding_current_step', currentStep.toString());
  }, [currentStep]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const methods = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      account_type: "individual",
    },
  });

  const { handleSubmit, watch, setValue, trigger, reset } = methods;
  const accountType = watch("account_type");

  // Adjust step if account type changes and current step is invalid for new account type
  useEffect(() => {
    // If user is on Business Info step but account type is individual, move to Account Profile
    if (currentStep === STEPS.BUSINESS_INFO && accountType === "individual") {
      setCurrentStep(STEPS.ACCOUNT_PROFILE);
    }
  }, [accountType, currentStep]);

  // Fetch existing onboarding data on page load and autofill fields
  useEffect(() => {
    const fetchOnboardingData = async () => {
      // Prevent multiple fetches
      if (hasFetchedData.current) {
        console.log('Data already fetched, skipping...');
        return;
      }
      
      try {
        setIsLoading(true);
        hasFetchedData.current = true; // Mark as fetched
        let userData: any = null;
        
        // Fetch user profile which includes onboarding data using correct endpoint
        console.log('Fetching user profile from /api/users/me...');
        const profileResponse = await axios.get('/api/users/me');
        console.log('Fetched user profile:', profileResponse.data);
        
        if (profileResponse.data.success && profileResponse.data.user) {
          userData = profileResponse.data.user;
          
          // Update auth store with latest user data (including wallets if available)
          if (setUser) {
            setUser(userData, profileResponse.data.wallets);
          }
          
          // Check if user is already onboarded (disable fields if true)
          if (userData.isOnboarded) {
            setIsAlreadyOnboarded(true);
          }
          
          // Auto-fill form with ALL existing user data (regardless of onboarding status)
          const formData: Partial<OnboardingData> = {};
          
          // Account type
          if (userData.account_type || userData.userType) {
            formData.account_type = userData.account_type || userData.userType;
            formData.userType = userData.userType || userData.account_type;
          }
          
          // Personal info fields (common for both account types)
          if (userData.first_name) formData.first_name = userData.first_name;
          if (userData.middle_name) formData.middle_name = userData.middle_name;
          if (userData.last_name) formData.last_name = userData.last_name;
          if (userData.phone_number) formData.phone_number = userData.phone_number;
          if (userData.address1) formData.address1 = userData.address1;
          if (userData.address2) formData.address2 = userData.address2;
          if (userData.city) formData.city = userData.city;
          if (userData.country) formData.country = userData.country;
          if (userData.state) formData.state = userData.state;
          if (userData.zipcode) formData.zipcode = userData.zipcode;
          
          // Account profile fields
          if (userData.purpose_of_account) formData.purpose_of_account = userData.purpose_of_account;
          if (userData.expected_transaction_activity) formData.expected_transaction_activity = userData.expected_transaction_activity;
          if (userData.is_politically_exposed !== undefined) formData.is_politically_exposed = userData.is_politically_exposed;
          
          // Individual account specific fields
            if (userData.account_type === "individual" || userData.userType === "individual") {
            if (userData.dob) formData.dob = userData.dob;
            if (userData.profession) formData.profession = userData.profession;
          }
          
          // Institutional account specific fields
            if (userData.account_type === "institutional" || userData.userType === "institutional") {
            if (userData.company_name) formData.company_name = userData.company_name;
            if (userData.registration_id) formData.registration_id = userData.registration_id;
            if (userData.company_website) formData.company_website = userData.company_website;
            if (userData.company_phone) formData.company_phone = userData.company_phone;
            if (userData.business_address1) formData.business_address1 = userData.business_address1;
            if (userData.business_address2) formData.business_address2 = userData.business_address2;
            if (userData.business_city) formData.business_city = userData.business_city;
            if (userData.business_country) formData.business_country = userData.business_country;
            if (userData.business_state) formData.business_state = userData.business_state;
            if (userData.business_zipcode) formData.business_zipcode = userData.business_zipcode;
            if (userData.authorized_signatory_name) formData.authorized_signatory_name = userData.authorized_signatory_name;
            if (userData.authorized_signatory_email) formData.authorized_signatory_email = userData.authorized_signatory_email;
            if (userData.authorized_signatory_phone) formData.authorized_signatory_phone = userData.authorized_signatory_phone;
            if (userData.is_politically_exposed !== undefined) formData.is_politically_exposed = userData.is_politically_exposed;
          }
          
          // Reset form with existing data (if any data exists)
          if (Object.keys(formData).length > 0) {
            console.log('Auto-filling form with data:', formData);
            reset(formData);
          } else {
            console.log('No existing user data to auto-fill');
          }
          
          // Restore step from sessionStorage after data is loaded
          const savedStep = sessionStorage.getItem('onboarding_current_step');
          if (savedStep) {
            const stepNum = parseInt(savedStep, 10);
            if (stepNum >= STEPS.ACCOUNT_TYPE && stepNum <= STEPS.KYC) {
              setCurrentStep(stepNum);
            }
          }
        } else {
          console.log('Failed to fetch user profile or no user data available');
        }

        // Check KYC status
        try {
          console.log('Fetching KYC status from /api/kyc/status...');
          const kycResponse = await axios.get('/api/kyc/status');
          console.log('KYC status response:', kycResponse.data);
          
          if (kycResponse.data.success) {
            const status = kycResponse.data.kycStatus;
            setKycStatus(status);
            
            // If user is onboarded but KYC not started/pending/rejected, go to KYC step
            if (userData?.isOnboarded && (status === 'not_started' || status === 'pending' || status === 'review' || status === 'rejected')) {
              console.log('User is onboarded, redirecting to KYC step');
              setCurrentStep(STEPS.KYC);
            }
          }
        } catch (kycError) {
          console.error('Error checking KYC status:', kycError);
        }
      } catch (error) {
        console.error('Error fetching onboarding data:', error);
        // Don't block the user if profile fetch fails - they can still proceed with onboarding
        // Reset the flag on error so user can retry if needed
        hasFetchedData.current = false;
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if user is authenticated
    if (user) {
      fetchOnboardingData();
    } else {
      console.log('No authenticated user, skipping data fetch');
      setIsLoading(false);
    }
    // Empty dependency array - only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveCurrentStepData = async () => {
    try {
      const formData = methods.getValues();
      // Only send fields that have values (not empty strings or undefined)
      const dataToSave: any = {
        userType: formData.account_type,
      };
      
      // Add account_type if present
      if (formData.account_type) {
        dataToSave.account_type = formData.account_type;
      }
      
      // Add all fields that have values (including false for booleans)
      Object.keys(formData).forEach((key) => {
        const value = formData[key as keyof OnboardingData];
        if (value !== undefined && value !== null) {
          // For strings, skip empty strings; for booleans, include false
          if (typeof value === 'boolean' || (typeof value === 'string' && value !== '')) {
            dataToSave[key] = value;
          }
        }
      });
      
      const response = await axios.post('/api/users/onboarding', dataToSave);
      if (response.data.success && response.data.user) {
        // Update form with latest data from server
        const userData = response.data.user;
        const updatedFormData: Partial<OnboardingData> = {};
        
        if (userData.account_type || userData.userType) {
          updatedFormData.account_type = userData.account_type || userData.userType;
          updatedFormData.userType = userData.userType || userData.account_type;
        }
        if (userData.first_name) updatedFormData.first_name = userData.first_name;
        if (userData.middle_name) updatedFormData.middle_name = userData.middle_name;
        if (userData.last_name) updatedFormData.last_name = userData.last_name;
        if (userData.phone_number) updatedFormData.phone_number = userData.phone_number;
        if (userData.address1) updatedFormData.address1 = userData.address1;
        if (userData.address2) updatedFormData.address2 = userData.address2;
        if (userData.city) updatedFormData.city = userData.city;
        if (userData.country) updatedFormData.country = userData.country;
        if (userData.state) updatedFormData.state = userData.state;
        if (userData.zipcode) updatedFormData.zipcode = userData.zipcode;
        if (userData.purpose_of_account) updatedFormData.purpose_of_account = userData.purpose_of_account;
        if (userData.expected_transaction_activity) updatedFormData.expected_transaction_activity = userData.expected_transaction_activity;
        if (userData.is_politically_exposed !== undefined) updatedFormData.is_politically_exposed = userData.is_politically_exposed;
        
        if (userData.account_type === "individual" || userData.userType === "individual") {
          if (userData.dob) updatedFormData.dob = userData.dob;
          if (userData.profession) updatedFormData.profession = userData.profession;
        }
        
        if (userData.account_type === "institutional" || userData.userType === "institutional") {
          if (userData.company_name) updatedFormData.company_name = userData.company_name;
          if (userData.registration_id) updatedFormData.registration_id = userData.registration_id;
          if (userData.company_website) updatedFormData.company_website = userData.company_website;
          if (userData.company_phone) updatedFormData.company_phone = userData.company_phone;
          if (userData.business_address1) updatedFormData.business_address1 = userData.business_address1;
          if (userData.business_address2) updatedFormData.business_address2 = userData.business_address2;
          if (userData.business_city) updatedFormData.business_city = userData.business_city;
          if (userData.business_country) updatedFormData.business_country = userData.business_country;
          if (userData.business_state) updatedFormData.business_state = userData.business_state;
          if (userData.business_zipcode) updatedFormData.business_zipcode = userData.business_zipcode;
          if (userData.authorized_signatory_name) updatedFormData.authorized_signatory_name = userData.authorized_signatory_name;
          if (userData.authorized_signatory_email) updatedFormData.authorized_signatory_email = userData.authorized_signatory_email;
          if (userData.authorized_signatory_phone) updatedFormData.authorized_signatory_phone = userData.authorized_signatory_phone;
        }
        
        // Merge with existing form data to preserve any unsaved changes
        // Only update fields that exist in updatedFormData, keep others from formData
        const mergedData: Partial<OnboardingData> = { ...formData };
        Object.keys(updatedFormData).forEach((key) => {
          const fieldKey = key as keyof OnboardingData;
          const value = updatedFormData[fieldKey];
          if (value !== undefined) {
            (mergedData as any)[fieldKey] = value;
          }
        });
        reset(mergedData);
        if (setUser) {
          setUser(userData);
        }
      }
      return response.data.success;
    } catch (error: any) {
      console.error("Error saving onboarding data:", error);
      setError(error.response?.data?.message || "Failed to save data");
      return false;
    }
  };

  const fetchLatestData = async () => {
    try {
      const profileResponse = await axios.get('/api/users/me');
      if (profileResponse.data.success && profileResponse.data.user) {
        const userData = profileResponse.data.user;
        const formData: Partial<OnboardingData> = {};
        
        if (userData.account_type || userData.userType) {
          formData.account_type = userData.account_type || userData.userType;
          formData.userType = userData.userType || userData.account_type;
        }
        if (userData.first_name) formData.first_name = userData.first_name;
        if (userData.middle_name) formData.middle_name = userData.middle_name;
        if (userData.last_name) formData.last_name = userData.last_name;
        if (userData.phone_number) formData.phone_number = userData.phone_number;
        if (userData.address1) formData.address1 = userData.address1;
        if (userData.address2) formData.address2 = userData.address2;
        if (userData.city) formData.city = userData.city;
        if (userData.country) formData.country = userData.country;
        if (userData.state) formData.state = userData.state;
        if (userData.zipcode) formData.zipcode = userData.zipcode;
        if (userData.purpose_of_account) formData.purpose_of_account = userData.purpose_of_account;
        if (userData.expected_transaction_activity) formData.expected_transaction_activity = userData.expected_transaction_activity;
        if (userData.is_politically_exposed !== undefined) formData.is_politically_exposed = userData.is_politically_exposed;
        
        if (userData.account_type === "individual" || userData.userType === "individual") {
          if (userData.dob) formData.dob = userData.dob;
          if (userData.profession) formData.profession = userData.profession;
        }
        
        if (userData.account_type === "institutional" || userData.userType === "institutional") {
          if (userData.company_name) formData.company_name = userData.company_name;
          if (userData.registration_id) formData.registration_id = userData.registration_id;
          if (userData.company_website) formData.company_website = userData.company_website;
          if (userData.company_phone) formData.company_phone = userData.company_phone;
          if (userData.business_address1) formData.business_address1 = userData.business_address1;
          if (userData.business_address2) formData.business_address2 = userData.business_address2;
          if (userData.business_city) formData.business_city = userData.business_city;
          if (userData.business_country) formData.business_country = userData.business_country;
          if (userData.business_state) formData.business_state = userData.business_state;
          if (userData.business_zipcode) formData.business_zipcode = userData.business_zipcode;
          if (userData.authorized_signatory_name) formData.authorized_signatory_name = userData.authorized_signatory_name;
          if (userData.authorized_signatory_email) formData.authorized_signatory_email = userData.authorized_signatory_email;
          if (userData.authorized_signatory_phone) formData.authorized_signatory_phone = userData.authorized_signatory_phone;
        }
        
        if (Object.keys(formData).length > 0) {
          reset(formData);
        }
      }
    } catch (error) {
      console.error("Error fetching latest data:", error);
    }
  };

  const handleNext = async () => {
    let isValid = false;

    if (currentStep === STEPS.ACCOUNT_TYPE) {
      isValid = accountType === "individual" || accountType === "institutional";
      if (!isValid) {
        setError("Please select an account type");
        return;
      }
    } else if (currentStep === STEPS.PERSONAL_INFO) {
      const fields = accountType === "individual" 
        ? ["first_name", "last_name", "phone_number", "address1", "city", "country", "state", "dob"]
        : ["first_name", "last_name", "phone_number", "address1", "city", "country", "state"];
      isValid = await trigger(fields as any);
    } else if (currentStep === STEPS.BUSINESS_INFO) {
      if (accountType === "institutional") {
        isValid = await trigger([
          "company_name", 
          "registration_id", 
          "business_address1", 
          "business_city", 
          "business_country", 
          "business_state",
          "authorized_signatory_name", 
          "authorized_signatory_email", 
          "authorized_signatory_phone"
        ]);
      } else {
        isValid = true;
      }
    } else if (currentStep === STEPS.ACCOUNT_PROFILE) {
      const fields = accountType === "institutional" 
        ? ["purpose_of_account", "expected_transaction_activity", "is_politically_exposed"]
        : ["purpose_of_account", "expected_transaction_activity"];
      isValid = await trigger(fields as any);
    }

    if (isValid) {
      setError("");
      setIsSubmitting(true);
      
      // Save current step data
      const saved = await saveCurrentStepData();
      if (!saved) {
        setIsSubmitting(false);
        return;
      }
      
      // Determine next step
      let nextStep = currentStep + 1;
      if (currentStep === STEPS.PERSONAL_INFO && accountType === "individual") {
        nextStep = STEPS.ACCOUNT_PROFILE;
      }
      if (nextStep > STEPS.KYC) {
        nextStep = STEPS.KYC;
      }
      
      setCurrentStep(nextStep);
      setIsSubmitting(false);
      
      // Fetch latest data when moving to next step
      await fetchLatestData();
    }
  };

  const handleBack = async () => {
    if (currentStep > STEPS.ACCOUNT_TYPE) {
      let prevStep = currentStep - 1;
      
      if (prevStep === STEPS.BUSINESS_INFO && accountType === "individual") {
        prevStep = STEPS.PERSONAL_INFO;
      }
      if (currentStep === STEPS.KYC) {
        prevStep = STEPS.ACCOUNT_PROFILE;
      }
      if (currentStep === STEPS.ACCOUNT_PROFILE && accountType === "individual") {
        prevStep = STEPS.PERSONAL_INFO;
      }
      
      setCurrentStep(prevStep);
      setError("");
      
      // Fetch latest data when going back to ensure form is synced
      await fetchLatestData();
    }
  };

  const handleSkip = async () => {
    try {
      setIsSubmitting(true);
      // Mark user as onboarded (skipped) without saving data
     const response = await axios.post('/api/users/onboarding', {
        skip: true
      });
      if (response.data.success) {
        setLocation("/assets");
      } else {
        setError(response.data.message || "Failed to skip onboarding");
      }
    } catch (error: any) {
      console.error("Error skipping onboarding:", error);
      setError(error.message || "Failed to skip onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: OnboardingData) => {
    try {
      setIsSubmitting(true);
      setError("");

      // Ensure userType matches account_type
      const onboardingData = {
        ...data,
        userType: data.account_type,
      };

      // Save onboarding data
      const response = await axios.post('/api/users/onboarding', onboardingData);
      
      if (response.data.success || response.data.isOnboarded) {
        // Update auth store with updated user data
        if (response.data.user && setUser) {
          setUser(response.data.user);
        }
      //  if (user?.kyc_status !== 'approved'){
      //   // Move to KYC step instead of redirecting
      //   setCurrentStep(STEPS.KYC);
      //   setError("");
      //  }else{
      //   setLocation("/assets");
      //  }
      setLocation("/assets");
      window.location.reload();
      } else {
        setError(response.data.message || "Failed to save onboarding data");
      }
    } catch (error: any) {
      console.error("Onboarding error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to save onboarding data";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get steps array for Stepper component (dynamically based on account type)
  const getStepsArray = useMemo(() => {
    const steps = [
      { label: STEP_NAMES[1] }, // Account Type
      { label: STEP_NAMES[2] }, // Personal Info
    ];
    
    // Add Business Info step only for institutional accounts
    if (accountType === "institutional") {
      steps.push({ label: STEP_NAMES[3] }); // Business Info
    }
    
    steps.push(
      { label: STEP_NAMES[4] }, // Account Profile
      { label: STEP_NAMES[5] }  // KYC
    );
    
    return steps;
  }, [accountType]);

  // Stepper style config with theme-aware colors
  const stepperStyleConfig = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      activeBgColor: isDark ? '#E5C07B' : '#CF9531', // brand-gold (dark) or brand-dark-gold (light)
      activeTextColor: '#FFFFFF',
      completedBgColor: isDark ? '#E5C07B' : '#CF9531',
      completedTextColor: '#FFFFFF',
      inactiveBgColor: isDark ? '#374151' : '#E5E7EB', // gray-700 (dark) or gray-200 (light)
      inactiveTextColor: isDark ? '#9CA3AF' : '#6B7280', // gray-400 (dark) or gray-500 (light)
      labelFontSize: '0.75rem',
      circleFontSize: '1rem',
      borderRadius: '50%',
      fontWeight: '600',
      size: '2.5rem', // Size of the step circle
    };
  }, [theme]);

  // Map currentStep (1-5) to stepper activeStep (0-based index)
  const getStepperActiveStep = () => {
    if (accountType === "individual") {
      // Individual: Account Type(1) -> Personal Info(2) -> Account Profile(4) -> KYC(5)
      if (currentStep === STEPS.ACCOUNT_TYPE) return 0;
      if (currentStep === STEPS.PERSONAL_INFO) return 1;
      if (currentStep === STEPS.ACCOUNT_PROFILE) return 2;
      if (currentStep === STEPS.KYC) return 3;
    } else {
      // Institutional: Account Type(1) -> Personal Info(2) -> Business Info(3) -> Account Profile(4) -> KYC(5)
      if (currentStep === STEPS.ACCOUNT_TYPE) return 0;
      if (currentStep === STEPS.PERSONAL_INFO) return 1;
      if (currentStep === STEPS.BUSINESS_INFO) return 2;
      if (currentStep === STEPS.ACCOUNT_PROFILE) return 3;
      if (currentStep === STEPS.KYC) return 4;
    }
    return 0;
  };

  const getTotalSteps = () => {
    // Individual: Account Type -> Personal Info -> Account Profile -> KYC (4 steps)
    // Institutional: Account Type -> Personal Info -> Business Info -> Account Profile -> KYC (5 steps)
    return accountType === "institutional" ? 5 : 4;
  };

  const getStepName = (step: number) => {
    if (step === STEPS.ACCOUNT_TYPE) return STEP_NAMES[1];
    if (step === STEPS.PERSONAL_INFO) return STEP_NAMES[2];
    if (step === STEPS.BUSINESS_INFO) return STEP_NAMES[3];
    if (step === STEPS.ACCOUNT_PROFILE) return STEP_NAMES[4];
    if (step === STEPS.KYC) return STEP_NAMES[5];
    return "";
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.ACCOUNT_TYPE:
        return (
          <RadioGroup
            label="Select Your Account Type"
            name="account_type"
            value={accountType || ""}
            onChange={(value) => {
                setValue("account_type", value as "individual" | "institutional");
                setValue("userType", value as "individual" | "institutional");
              }}
            options={[
              {
                value: "individual",
                label: "Individual Account",
                description: "For personal accounts and individual investors"
              },
              {
                value: "institutional",
                label: "Institutional Account",
                description: "For companies and organizations"
              }
            ]}
            disabled={isAlreadyOnboarded}
          />
        );
      case STEPS.PERSONAL_INFO:
        return <StepPersonalInfo disabled={isAlreadyOnboarded} />;
      case STEPS.BUSINESS_INFO:
        return accountType === "institutional" ? <StepBusinessInfo disabled={isAlreadyOnboarded} /> : null;
      case STEPS.ACCOUNT_PROFILE:
        return <StepAccountProfile disabled={isAlreadyOnboarded} />;
      case STEPS.KYC:
        return <StepKYC />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="py-16">
              <div className="flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark-gold dark:border-brand-gold mx-auto"></div>
                  <p className="text-lg text-gray-600 dark:text-gray-400">Loading your profile...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              Complete Your Profile
            </CardTitle>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Step {getStepperActiveStep() + 1} of {getStepsArray.length}: {getStepName(currentStep)}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Info banner for already onboarded users */}
                {isAlreadyOnboarded && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Your profile is complete!</strong> The information below has been saved. You can review it here, and proceed to KYC verification if needed.</span>
                    </p>
                  </div>
                )}
                
                {/* Progress Steps */}
                <div className="mb-8">
                  <Stepper
                    steps={getStepsArray}
                    activeStep={getStepperActiveStep()}
                    styleConfig={stepperStyleConfig}
                    className="stepper-container"
                  />
                </div>

                {/* Step Content */}
                <div className="mb-8 min-h-[400px]">{renderStepContent()}</div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    {currentStep > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleBack}
                        className="h-11 px-6"
                      >
                        Back
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSkip}
                      disabled={isSubmitting}
                      className="h-11 px-6"
                    >
                      Skip for Now
                    </Button>
                    {currentStep < STEPS.KYC ? (
                      <Button 
                        type="button" 
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="h-11 px-8"
                      >
                        {isSubmitting ? "Saving..." : "Next"}
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="h-11 px-8"
                      >
                        {isSubmitting ? "Saving..." : "Complete Onboarding"}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

