import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { ValidatedRequest } from '../middleware/validate.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { 
  SignupData, 
  VerifyEmailData, 
  LoginCredentials,
  Verify2FAData,
  ForgotPasswordData,
  ResetPasswordData,
  UpdatePasswordData,
  ResendOTPData
} from '../schemas/auth.schema';
import { storagePromise } from '../storage/index.js';
import { SendGridEmailService } from '../services/sendgrid.service';
import { JWTService } from '../services/jwt.service';
import { OTPService } from '../services/otp.service';
import { otpRateLimiter } from '../utils/rate-limiter';



export class AuthController {
  /**
   * User signup endpoint
   */
  static async signup(req: ValidatedRequest<SignupData>, res: Response): Promise<void> {
    try {
      const signupData = req.validated;
      const storage = await storagePromise;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(signupData.email);
      if (existingUser) {
        res.status(400).json({ 
          message: "User with this email already exists" 
        });
        return;
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(signupData.password, saltRounds);

      // Generate OTP and expiration
      const otp = OTPService.generateOTP();
      const otpExpiration = OTPService.getOTPExpiration();

      // Create user data with hashed password (names will be collected during onboarding)
      const userDataForSignup = {
        email: signupData.email,
        password_hash: hashedPassword, // Use our hashed password (12 rounds)
        first_name: '', // Will be set during onboarding
        last_name: '', // Will be set during onboarding
        terms_accepted: signupData.terms_accepted,
        country: '', // Will be set during onboarding
        state: '', // Will be set during onboarding
        isOnboarded: false, // New users start with onboarding incomplete
        kyc_status: 'not_started' as const
      };

      // Create user in database
      const user = await storage.createUser(userDataForSignup as any);

      // Set OTP data for email verification
      await storage.updateUser(user._id!, {
        email_verification_token: otp,
        email_verification_expires: otpExpiration,
        otp_attempts: 0
      });

      // Send OTP email using SendGrid
      await SendGridEmailService.sendOTPEmail(signupData.email, otp, 'User');

      res.status(201).json({
        message: "Signup successful. Please verify your email using the OTP sent."
      });

    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ 
        message: "Internal server error during signup" 
      });
    }
  }

  /**
   * Email verification endpoint
   */
  static async verifyEmail(req: ValidatedRequest<VerifyEmailData>, res: Response): Promise<void> {
    try {
      const { email, otp } = req.validated;
      const storage = await storagePromise;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.status(404).json({ 
          message: "User not found" 
        });
        return;
      }

      // Check if already verified
      if (user.email_verified) {
        res.status(400).json({ 
          message: "Email is already verified" 
        });
        return;
      }

      // Check for brute-force attempts
      const maxAttempts = 5;
      const currentAttempts = user.otp_attempts || 0;
      
      if (currentAttempts >= maxAttempts) {
        res.status(429).json({ 
          message: "Too many OTP attempts. Please request a new OTP." 
        });
        return;
      }

      // Normalize OTP comparison and validate
      if (!user.email_verification_token || user.email_verification_token !== String(otp)) {
        // Increment failed attempt count
        await storage.updateUser(user._id!, {
          otp_attempts: currentAttempts + 1
        });
        
        res.status(400).json({ 
          message: "Invalid OTP" 
        });
        return;
      }

      // Check OTP expiration
      if (OTPService.isOTPExpired(user.email_verification_expires)) {
        res.status(400).json({ 
          message: "OTP has expired" 
        });
        return;
      }

      // Update user as verified and reset attempt counter
      await storage.updateUser(user._id!, {
        account_status: 'verified',
        email_verified: true,
        email_verification_token: undefined,
        email_verification_expires: undefined,
        otp_attempts: 0
      });

      // Generate JWT token for immediate login after verification
      const token = JWTService.generateToken({
        user_id: user._id!,
        email: user.email
      });

      // Return success response with token and user data
      res.status(200).json({
        message: "Email verified successfully.",
        token,
        user: {
          user_id: user._id!,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          account_status: 'verified'
        }
      });

    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ 
        message: "Internal server error during email verification" 
      });
    }
  }

  /**
   * User login endpoint
   */
  static async login(req: ValidatedRequest<LoginCredentials>, res: Response): Promise<void> {
    try {
      const { email, password } = req.validated;
      const storage = await storagePromise;

      // Find user by email (case-insensitive)
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        res.status(404).json({ 
          message: "User not found" 
        });
        return;
      }

      // Check if email is verified
      if (!user.email_verified) {
        res.status(403).json({ 
          message: "Please verify your email first" 
        });
        return;
      }

      // Compare password with hash
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({ 
          message: "Invalid credentials" 
        });
        return;
      }

      // Check if 2FA is enabled for the user
      if (user.two_factor_enabled) {
        // Generate 2FA OTP
        const otp = OTPService.generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store 2FA token and expiration
        await storage.updateUser(user._id!, {
          two_factor_token: otp,
          two_factor_expires: otpExpires
        });

        // Send 2FA OTP email using SendGrid
        await SendGridEmailService.sendTwoFactorOTP(user.email, user.first_name || 'User', otp);

        // Return 2FA required response
        res.status(200).json({
          message: "2FA verification required",
          requires_2fa: true,
          email: user.email
        });
        return;
      }

      // If 2FA is disabled, proceed with normal login
      // Generate JWT token
      const token = JWTService.generateToken({
        user_id: user._id!,
        email: user.email
      });

      // Update last login timestamp
      await storage.updateUser(user._id!, {
        last_login: new Date()
      });

      // Return success response with token and user data
      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          user_id: user._id!,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          account_status: user.account_status,
          isOnboarded: user.isOnboarded
        }
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        message: "Internal server error during login" 
      });
    }
  }

  /**
   * Forgot password endpoint
   */
  static async forgotPassword(req: ValidatedRequest<ForgotPasswordData>, res: Response): Promise<void> {
    try {
      const { email } = req.validated;
      const storage = await storagePromise;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        res.status(200).json({
          message: "If your email is registered, you will receive a password reset link."
        });
        return;
      }

      // Generate password reset token
      const resetToken = JWTService.generateResetToken({
        user_id: user._id!,
        email: user.email,
        type: 'password_reset'
      }, '1h');

      // Set reset token and expiration in database
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await storage.updateUser(user._id!, {
        password_reset_token: resetToken,
        password_reset_expires: resetExpires
      });

      // Send reset email using SendGrid
      await SendGridEmailService.sendPasswordResetEmail(email, resetToken, user.first_name);

      res.status(200).json({
        message: "If your email is registered, you will receive a password reset link."
      });

    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        message: "Internal server error during password reset request"
      });
    }
  }

  /**
   * Reset password endpoint
   */
  static async resetPassword(req: ValidatedRequest<ResetPasswordData>, res: Response): Promise<void> {
    try {
      const { token, password } = req.validated;
      const storage = await storagePromise;

      // Verify reset token
      const payload = JWTService.verifyResetToken(token);
      if (!payload) {
        res.status(400).json({
          message: "Invalid or expired reset token"
        });
        return;
      }

      // Find user and verify token matches
      const user = await storage.getUserByEmail(payload.email);
      if (!user || user.password_reset_token !== token) {
        res.status(400).json({
          message: "Invalid or expired reset token"
        });
        return;
      }

      // Check if token has expired
      if (!user.password_reset_expires || new Date() > user.password_reset_expires) {
        res.status(400).json({
          message: "Reset token has expired"
        });
        return;
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update password and clear reset token
      await storage.updateUser(user._id!, {
        password_hash: hashedPassword,
        password_reset_token: undefined,
        password_reset_expires: undefined
      });

      res.status(200).json({
        message: "Password reset successful"
      });

    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        message: "Internal server error during password reset"
      });
    }
  }

  /**
   * Update password endpoint (requires authentication)
   */
  static async updatePassword(req: ValidatedRequest<UpdatePasswordData> & AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { old_password, new_password } = req.validated;
      const { user_id } = req.user;
      const storage = await storagePromise;

      // Get current user
      const user = await storage.getUser(user_id);
      if (!user) {
        res.status(404).json({
          message: "User not found"
        });
        return;
      }

      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(old_password, user.password_hash);
      if (!isOldPasswordValid) {
        res.status(400).json({
          message: "Current password is incorrect"
        });
        return;
      }

      // Check if new password is different from old password
      const isSamePassword = await bcrypt.compare(new_password, user.password_hash);
      if (isSamePassword) {
        res.status(400).json({
          message: "New password must be different from current password"
        });
        return;
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(new_password, saltRounds);

      // Update password
      await storage.updateUser(user_id, {
        password_hash: hashedPassword
      });

      res.status(200).json({
        message: "Password updated successfully"
      });

    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({
        message: "Internal server error during password update"
      });
    }
  }

  /**
   * Resend OTP endpoint with rate limiting
   */
  static async resendOTP(req: ValidatedRequest<ResendOTPData>, res: Response): Promise<void> {
    try {
      const { email, purpose } = req.validated;
      const storage = await storagePromise;

      // Check rate limiting (60 seconds between requests)
      const rateLimitResult = otpRateLimiter.checkLimit(email);
      if (!rateLimitResult.allowed) {
        res.status(429).json({
          message: `Please wait ${rateLimitResult.remainingTime} seconds before requesting another OTP`,
          remainingTime: rateLimitResult.remainingTime
        });
        return;
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.status(404).json({
          message: "User not found"
        });
        return;
      }

      // Handle different purposes
      if (purpose === "email_verification") {
        // Check if user is already verified for email verification purpose
        if (user.email_verified) {
          res.status(400).json({
            message: "Email is already verified"
          });
          return;
        }

        // Generate new OTP for email verification
        const otp = OTPService.generateOTP();
        const otpExpiration = OTPService.getOTPExpiration();

        // Update user with new OTP and reset attempt counter
        await storage.updateUser(user._id!, {
          email_verification_token: otp,
          email_verification_expires: otpExpiration,
          otp_attempts: 0,
          last_otp_sent: new Date()
        });

        // Send OTP email using SendGrid
        await SendGridEmailService.sendOTPEmail(email, otp, user.first_name);

        res.status(200).json({
          message: "New email verification OTP sent successfully"
        });

      } else if (purpose === "2fa") {
        // Check if user's email is verified (prerequisite for 2FA)
        if (!user.email_verified) {
          res.status(400).json({
            message: "Please verify your email first"
          });
          return;
        }

        // Check if 2FA is enabled
        if (!user.two_factor_enabled) {
          res.status(400).json({
            message: "Two-factor authentication is not enabled for this account"
          });
          return;
        }

        // Generate new 2FA OTP
        const otp = OTPService.generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with new 2FA token
        await storage.updateUser(user._id!, {
          two_factor_token: otp,
          two_factor_expires: otpExpires,
          last_otp_sent: new Date()
        });

        // Send 2FA OTP email using SendGrid
        await SendGridEmailService.sendTwoFactorOTP(email, user.first_name || 'User', otp);

        res.status(200).json({
          message: "New 2FA verification code sent successfully"
        });
      }

    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({
        message: "Internal server error during OTP resend"
      });
    }
  }

  /**
   * Verify 2FA OTP endpoint
   */
  static async verify2FA(req: ValidatedRequest<Verify2FAData>, res: Response): Promise<void> {
    try {
      const { email, otp } = req.validated;
      const storage = await storagePromise;

      // Find user by email
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        res.status(404).json({ 
          message: "User not found" 
        });
        return;
      }

      // Check if user has a 2FA token
      if (!user.two_factor_token) {
        res.status(400).json({ 
          message: "No 2FA verification pending for this user" 
        });
        return;
      }

      // Check if OTP matches
      if (user.two_factor_token !== otp) {
        res.status(400).json({ 
          message: "Invalid 2FA code" 
        });
        return;
      }

      // Check OTP expiration
      if (!user.two_factor_expires || OTPService.isOTPExpired(user.two_factor_expires)) {
        res.status(400).json({ 
          message: "2FA code has expired" 
        });
        return;
      }

      // Generate JWT token for successful 2FA verification
      const token = JWTService.generateToken({
        user_id: user._id!,
        email: user.email
      });

      // Clear 2FA tokens and update last login
      await storage.updateUser(user._id!, {
        two_factor_token: undefined,
        two_factor_expires: undefined,
        last_login: new Date()
      });

      // Return success response with token and user data
      res.status(200).json({
        message: "2FA verified successfully",
        token,
        user: {
          user_id: user._id!,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          account_status: user.account_status,
          isOnboarded: user.isOnboarded
        }
      });

    } catch (error) {
      console.error("2FA verification error:", error);
      res.status(500).json({ 
        message: "Internal server error during 2FA verification" 
      });
    }
  }


}