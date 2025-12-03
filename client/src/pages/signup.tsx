import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { signupSchema, type SignupData, verifyEmailSchema, type VerifyEmailData } from "@shared/schema";
import { useTheme } from "@/contexts/ThemeContext";
import lightLogoPath from "@assets/WNVaultedAssets_1753707707419.png";
import darkLogoPath from "@assets/VaultedAssets (1)_1753709040936.png";
import { OtpInputBox } from "@/components/ui/OtpInputBox";
import { signupUser, verifyEmail, resendOTP } from "@/api/mutations";
import { useAuthStore } from "@/stores/authStore";
import axios from '../lib/axios';
import { useTranslation } from "react-i18next";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const { login } = useAuthStore();
  const { t } = useTranslation();
  const logoPath = theme === "dark" ? darkLogoPath : lightLogoPath;
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [apiError, setApiError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: (() => {
      // Restore form data from sessionStorage on mount
      const savedData = sessionStorage.getItem("signupFormData");
      if (savedData) {
        try {
          return JSON.parse(savedData);
        } catch (error) {
          console.error("Error parsing saved form data:", error);
        }
      }
      return {};
    })(),
  });

  // Watch all form values to save them to localStorage
  const formValues = watch();

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    // Save if any form field has a value
    if (formValues.email || formValues.password || formValues.confirm_password || formValues.terms_accepted) {
      sessionStorage.setItem("signupFormData", JSON.stringify(formValues));
    } else {
      // Clear sessionStorage if form is empty
      sessionStorage.removeItem("signupFormData");
    }
  }, [formValues]);

  // Timer effect for resend OTP countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const onSubmit = async (data: SignupData) => {
    try {
      setApiError("");
      
      console.log("Signup data:", data);

      // Make API call to signup endpoint
      await signupUser(data);
      
      // Store user email for OTP verification and show OTP form
      setUserEmail(data.email);
      setShowOtp(true);
      
      // Clear form data from localStorage after successful signup
      localStorage.removeItem("signupFormData");
    } catch (error: any) {
      console.error("Signup error:", error);
      setApiError(error.message || "An error occurred during signup. Please try again.");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setOtpError("");
    
    try {
      // Prepare OTP verification data
      const verifyData: VerifyEmailData = {
        email: userEmail,
        otp: otp
      };

      // Make API call to verify OTP
      const response = await verifyEmail(verifyData);
      
      // Store auth data in Zustand store and redirect to onboarding
      login(response.token, response.user);
      
      // Clear form data from localStorage after successful verification
      localStorage.removeItem("signupFormData");
      
      // Redirect to onboarding page after successful verification
      setTimeout(() => {
        setLocation("/onboarding");
      }, 200);
    } catch (error: any) {
      console.error("OTP verification error:", error);
      setOtpError(error.message || "Invalid OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setOtpError("");
    
    try {
      await resendOTP({ email: userEmail, purpose: "email_verification" });
      setResendTimer(60); // Start 60-second countdown
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      setOtpError(error.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // OTP Verification Screen
  if (showOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => setShowOtp(false)}
              className="mb-4 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
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
              {t("auth.backToSignUp")}
            </button>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("auth.verifyYourEmail")}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t("auth.enterOTPSent")} {userEmail}.
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <OtpInputBox
                  value={otp}
                  onChange={setOtp}
                  error={otpError}
                  autoFocus
                />
                <Button type="submit" className="w-full" disabled={isVerifying}>
                  {isVerifying ? t("auth.verifying") : t("auth.continue")}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {t("auth.didntReceiveOTP")}
                  </p>
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("auth.resendOTPIn")} {resendTimer} {t("auth.seconds")}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={isResending}
                      className="text-sm text-brand-dark-gold dark:text-brand-gold hover:text-brand-brown dark:hover:text-brand-gold/80 underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending ? t("auth.resending") : t("auth.resendOTP")}
                    </button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Signup Form Screen - Only 4 fields: name, email, password, confirmPassword
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
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
            {t("auth.createAccount")}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t("auth.joinPlatform")}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {/* Email field */}
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

                {/* Password field */}
                <div>
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className="pr-10"
                      placeholder={t("auth.passwordPlaceholder")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password field */}
                <div>
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirm_password")}
                      className="pr-10"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.confirm_password.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={watch("terms_accepted")}
                    onCheckedChange={(checked) => {
                      setValue("terms_accepted", !!checked);
                    }}
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    {t("auth.agreeToTerms")}{" "}
                    <Link href="/terms-of-service">
                      <span className="text-brand-dark-gold dark:text-brand-gold hover:text-brand-brown dark:hover:text-brand-gold/80 underline cursor-pointer">
                        {t("auth.termsOfService")}
                      </span>
                    </Link>{" "}
                    {t("auth.and")}{" "}
                    <Link href="/privacy-policy">
                      <span className="text-brand-dark-gold dark:text-brand-gold hover:text-brand-brown dark:hover:text-brand-gold/80 underline cursor-pointer">
                        {t("auth.privacyPolicy")}
                      </span>
                    </Link>
                  </Label>
                </div>
                {errors.terms_accepted && (
                  <p className="text-red-500 text-sm ml-6">
                    {errors.terms_accepted.message}
                  </p>
                )}
              </div>

              {apiError && (
                <p className="text-red-500 text-sm text-center">
                  {apiError}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("auth.creating") : t("auth.signUp")}
              </Button>

              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("auth.alreadyHaveAccount")}{" "}
                </span>
                <Link href="/signin">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:text-primary/80"
                  >
                    {t("auth.signIn")}
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
