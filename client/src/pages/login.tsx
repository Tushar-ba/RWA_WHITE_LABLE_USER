import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import lightLogoPath from "@assets/WNVaultedAssets_1753707707419.png";
import darkLogoPath from "@assets/VaultedAssets (1)_1753709040936.png";
import { OtpInputBox } from "@/components/ui/OtpInputBox";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { loginUser, verifyEmail, resendOTP, verify2FA } from "@/api/mutations";
import { useAuthStore } from "@/stores/authStore";
import axios from '../lib/axios';

export default function SignIn() {
  const [location, setLocation] = useLocation();
  const { theme } = useTheme();
  const { t } = useTranslation("common");
  const { login } = useAuthStore();
  const logoPath = theme === "dark" ? darkLogoPath : lightLogoPath;
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Function to check KYC status and redirect accordingly
  const checkKycAndRedirect = async () => {
    try {
      const response = await axios.get('/api/kyc/status');
      if (response.data.success) {
        const kycStatus = response.data.kycStatus;
        
        // If KYC is not started, redirect to onboarding (KYC step)
        if (kycStatus === 'not_started') {
          setLocation("/onboarding");
        } else if (kycStatus === 'pending' || kycStatus === 'review' || kycStatus === 'rejected') {
          // For existing KYC processes, go to onboarding (KYC step)
          setLocation("/onboarding");
        } else {
          // KYC is approved, go to assets page
          setLocation("/assets");
        }
      } else {
        // Fallback to assets page if can't check KYC
        setLocation("/assets");
      }
    } catch (error) {
      console.error('Error checking KYC status:', error);
      // Fallback to assets page
      setLocation("/assets");
    }
  };

  // TanStack Query mutations
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Check if 2FA is required
      console.log(data ,"data", data && data.requires_2fa )
      if (data && data.requires_2fa) {
        setNeeds2FA(true);
        setUserEmail(data.email || getValues("email"));
        setApiError("");
        return;
      }
      
      // Store auth data in Zustand store for normal login
      login(data.token, data.user);
      
      // Clear form and redirect
      reset();
      setApiError("");
      console.log( "data.user", data)
      // Check onboarding status first, then KYC
      setTimeout(() => {
        // Check if user is onboarded
        if (data.user && !data.user.isOnboarded) {
          setLocation("/onboarding");
        } else {
          checkKycAndRedirect();
        }
      }, 100);
    },
    onError: (error: any) => {
      console.error("Login error:", error.message);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (error?.message) {
        const fullMessage = error.message;
        try {
          const jsonMatch = fullMessage.match(/\{.*\}/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
            errorMessage = jsonData.message || fullMessage;
          } else {
            errorMessage = fullMessage;
          }
        } catch (parseError) {
          errorMessage = fullMessage;
        }
      }
      
      // Check if it's an email verification error
      if (errorMessage.includes("Please verify your email first")) {
        setNeedsEmailVerification(true);
        setUserEmail(getValues("email"));
      }
      
      setApiError(errorMessage);
    }
  });

  // 2FA verification mutation
  const verify2FAMutation = useMutation({
    mutationFn: verify2FA,
    onSuccess: (data) => {
      // Store auth data in Zustand store after successful 2FA
      login(data.token, data.user);
      
      // Clear states and redirect
      setNeeds2FA(false);
      setOtp("");
      setOtpError("");
      setApiError("");
      
      // Check onboarding status first, then KYC
      setTimeout(() => {
        // Check if user is onboarded
        if (data.user && !data.user.isOnboarded) {
          setLocation("/onboarding");
        } else {
          checkKycAndRedirect();
        }
      }, 100);
    },
    onError: (error: any) => {
      console.error("2FA verification error:", error);
      
      let errorMessage = "2FA verification failed. Please try again.";
      
      if (error?.message) {
        const fullMessage = error.message;
        try {
          const jsonMatch = fullMessage.match(/\{.*\}/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
            errorMessage = jsonData.message || fullMessage;
          } else {
            errorMessage = fullMessage;
          }
        } catch (parseError) {
          errorMessage = fullMessage;
        }
      }
      
      setOtpError(errorMessage);
    }
  });

  const verifyEmailMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      // After successful verification, automatically attempt login
      const email = getValues("email");
      const password = getValues("password");
      loginMutation.mutate({ email, password });
    },
    onError: (error: any) => {
      console.error("OTP verification error:", error);
      
      let errorMessage = "Invalid OTP. Please try again.";
      
      if (error?.message) {
        const fullMessage = error.message;
        try {
          const jsonMatch = fullMessage.match(/\{.*\}/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
            errorMessage = jsonData.message || fullMessage;
          } else {
            errorMessage = fullMessage;
          }
        } catch (parseError) {
          errorMessage = fullMessage;
        }
      }
      
      setOtpError(errorMessage);
    }
  });

  const resendOTPMutation = useMutation({
    mutationFn: resendOTP,
    onSuccess: () => {
      setResendTimer(60);
      setOtpError("");
      setApiError("Verification email sent successfully! Please check your inbox.");
      console.log("OTP resent successfully");
    },
    onError: (error: any) => {
      console.error("Resend OTP error:", error);
      
      let errorMessage = "Failed to resend OTP. Please try again.";
      
      if (error?.message) {
        const fullMessage = error.message;
        try {
          const jsonMatch = fullMessage.match(/\{.*\}/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
            errorMessage = jsonData.message || fullMessage;
          } else {
            errorMessage = fullMessage;
          }
        } catch (parseError) {
          errorMessage = fullMessage;
        }
      }
      
      setOtpError(errorMessage);
    }
  });

  // Check if coming from password reset
  useEffect(() => {
    if (location.includes("reset=success")) {
      setShowResetSuccess(true);
      setTimeout(() => setShowResetSuccess(false), 5000);
    }
  }, [location]);

  // Timer effect for resend OTP countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginCredentials) => {
    setApiError(""); // Clear any previous API errors
    loginMutation.mutate(data);
  };
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    
    if (needs2FA) {
      // Handle 2FA verification
      verify2FAMutation.mutate({
        email: userEmail,
        otp: otp
      });
    } else {
      // Handle email verification
      verifyEmailMutation.mutate({
        email: userEmail,
        otp: otp
      });
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    const purpose = needs2FA ? "2fa" : "email_verification";
    resendOTPMutation.mutate({ email: userEmail, purpose });
  };
  if (showOtp || needsEmailVerification || needs2FA) {
    const isEmailVerification = needsEmailVerification && !needs2FA;
    const is2FA = needs2FA;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-sm sm:max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center">
            <button
              onClick={() => {
                setShowOtp(false);
                setNeedsEmailVerification(false);
                setNeeds2FA(false);
                setApiError("");
                setOtp("");
                setOtpError("");
                setResendTimer(0);
              }}
              className="mb-3 sm:mb-4 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base"
              data-testid="button-back-to-login"
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t("auth.backToLogin")}
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {is2FA ? t("auth.twoFactorAuth") : t("auth.verifyEmail")}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
              {is2FA 
                ? `${t("auth.enter2FACode")} ${userEmail}`
                : `${t("auth.enterOTPCode")} ${userEmail}`
              }
            </p>
          </div>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleOtpSubmit} className="space-y-4 sm:space-y-6">
                <OtpInputBox
                  value={otp}
                  onChange={setOtp}
                  error={otpError}
                  autoFocus
                />
                
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-gray-500 text-xs sm:text-sm">
                      {t("auth.resendOTPIn")} {resendTimer} {t("auth.seconds")}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendOTPMutation.isPending}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm underline cursor-pointer disabled:opacity-50"
                      data-testid="button-resend-otp"
                    >
                      {resendOTPMutation.isPending ? t("auth.resending") : t("auth.resendOTP")}
                    </button>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-10 sm:h-auto text-sm sm:text-base"
                  disabled={verifyEmailMutation.isPending || verify2FAMutation.isPending}
                  data-testid="button-verify-2fa"
                >
                  {(verifyEmailMutation.isPending || verify2FAMutation.isPending) 
                    ? t("auth.verifying")
                    : is2FA 
                    ? t("auth.verifyLogin")
                    : t("auth.continue")
                  }
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <img
              src={logoPath}
              alt="Vaulted Assets Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("auth.welcomeBack")}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t("auth.signInDescription")}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {showResetSuccess && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                Password reset successful! You can now sign in with your new
                password.
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="mt-1"
                    placeholder={t("auth.emailPlaceholder")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="mt-1 pr-10"
                    placeholder={t("auth.passwordPlaceholder")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-[2.25rem] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                    aria-label={
                      showPassword ? t("auth.hidePassword") : t("auth.showPassword")
                    }
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                  {apiError && (
                    <p className="text-red-500 text-sm mt-1">
                      {apiError === "Invalid credentials" 
                        ? t("auth.wrongPassword")
                        : needsEmailVerification
                        ? <>
                            {t("auth.verifyEmailFirst")}{" "}
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                              onClick={() => {
                                setShowOtp(true);
                                setApiError("");
                              }}
                            >
                              {t("auth.clickHere")}
                            </button>
                          </>
                        : apiError
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link href="/forgot-password">
                    <span className="text-primary hover:text-primary/80 cursor-pointer">
                      {t("auth.forgotPassword")}
                    </span>
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? t("auth.signingIn") : t("auth.signIn")}
              </Button>

              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("auth.noAccount")}{" "}
                </span>
                <Link href="/signup">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:text-primary/80"
                  >
                    {t("auth.signUp")}
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
