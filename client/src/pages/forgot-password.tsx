import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/api/mutations";
import { useTheme } from "@/contexts/ThemeContext";
import lightLogoPath from "@assets/WNVaultedAssets_1753707707419.png";
import darkLogoPath from "@assets/VaultedAssets (1)_1753709040936.png";

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const logoPath = theme === "dark" ? darkLogoPath : lightLogoPath;
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      setApiError("");
      
      // Make API call to forgot password endpoint
      await forgotPassword(data);
      
      // Store email for confirmation display and move to step 2
      setEmail(data.email);
      setStep(2);
    } catch (error: any) {
      console.error("Forgot password error:", error);
      setApiError(error.message || "An error occurred. Please try again.");
    }
  };

  // Step 1: Enter email
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => setLocation("/signin")}
              className="mb-4 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Login
            </button>
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <img
                src={logoPath}
                alt="Vaulted Assets Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Forgot Password
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your email to receive a reset link.
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="mt-1"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {apiError && (
                  <p className="text-red-500 text-sm text-center">
                    {apiError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Email sent confirmation
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => setStep(1)}
              className="mb-4 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Email Sent
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              If your email is registered, you will receive a password reset link at {email}. Click the link in your email to reset your password.
            </p>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setStep(1)}
                >
                  Try Again
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setLocation("/signin")}
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default return (should not reach here)
  return null;
}
