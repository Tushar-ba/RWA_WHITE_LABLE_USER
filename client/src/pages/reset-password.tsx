import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "@/api/mutations";
import { useTheme } from "@/contexts/ThemeContext";
import lightLogoPath from "@assets/WNVaultedAssets_1753707707419.png";
import darkLogoPath from "@assets/VaultedAssets (1)_1753709040936.png";

// Validation schema for reset password
const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [location, setLocation] = useLocation();
  const { theme } = useTheme();
  const logoPath = theme === "dark" ? darkLogoPath : lightLogoPath;
  
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Extract token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (resetToken) {
      setToken(resetToken);
    } else {
      setTokenError("Invalid or missing reset token. Please use the link from your email.");
    }
  }, [location]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setApiError("");
      
      if (!token) {
        setApiError("Reset token is missing. Please use the link from your email.");
        return;
      }

      // Make API call to reset password endpoint
      await resetPassword({
        token,
        password: data.password
      });
      
      setSuccess(true);
    } catch (error: any) {
      console.error("Reset password error:", error);
      setApiError(error.message || "Failed to reset password. Please try again.");
    }
  };

  // Show success message after password reset
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Password Reset Successful
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <Button 
                className="w-full"
                onClick={() => setLocation("/signin?reset=success")}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error if token is missing or invalid
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {tokenError}
            </p>
          </div>
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/forgot-password")}
              >
                Request New Reset Link
              </Button>
              <Button 
                variant="ghost"
                className="w-full"
                onClick={() => setLocation("/signin")}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below.
          </p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="relative">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="mt-1 pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-[2.25rem] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
              
              <div className="relative">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className="mt-1 pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-[2.25rem] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              
              {apiError && (
                <p className="text-red-500 text-sm text-center">{apiError}</p>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
              
              <div className="text-center">
                <Button 
                  variant="ghost"
                  onClick={() => setLocation("/signin")}
                  className="text-sm"
                >
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}