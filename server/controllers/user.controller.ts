import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ValidatedRequest } from '../middleware/validate.middleware';
import { storagePromise } from '../storage/index.js';
import { Logger } from '../utils/logger';
import { User as UserInterface, updateUserProfileSchema, UpdateUserProfile, usernameCheckSchema, UsernameCheck, onboardingSchema, OnboardingData } from '../../shared/schema.js';
import { updatePasswordSchema } from '../schemas/auth.schema.js';

export class UserController {
  /**
   * Get authenticated user profile
   */
  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(401).json({ 
          message: "Authentication required" 
        });
        return;
      }



      // REQUIRED: Use populate method for data retrieval - single query approach
      const storage = await storagePromise;
      const result = await (storage as any).getUserWithWallets(userId);
      
      if (!result) {
        // Check if this is a legacy UUID token issue
        if (userId && !userId.match(/^[0-9a-fA-F]{24}$/)) {
          res.status(401).json({ 
            message: "Your session has expired. Please log in again.",
            code: "LEGACY_TOKEN"
          });
          return;
        }
        
        res.status(404).json({ 
          message: "User not found" 
        });
        return;
      }

      const { user, wallets } = result;

      // // Remove sensitive information before sending response
      // const userProfile = {
      //   user_id: user._id, // Use _id as the user ID
      //   email: user.email,
      //   username: user.username,
      //   partyId: user.partyId,
      //   first_name: user.first_name,
      //   last_name: user.last_name,
      //   phone_number: user.phone_number,
      //   country: user.country,
      //   state: user.state,
      //   organization_name: user.organization_name,
      //   account_status: user.account_status,
      //   email_verified: user.email_verified,
      //   referral_code: user.referral_code,
      //   terms_accepted: user.terms_accepted,
      //   last_login: user.last_login,
      //   created_at: user.created_at,
      //   updated_at: user.updated_at
      // };

      delete user.password_hash;
      delete user.terms_accepted;
      delete user.two_factor_enabled;
      delete user.email_verification_expires;
      delete user.email_verification_token;


      Logger.info(`Profile fetched successfully for user ${userId}`);

      // Disable caching for user profile data to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        user: user,
        wallets: wallets
      });

    } catch (error) {
      Logger.error("Get profile error:", error);
      res.status(500).json({ 
        message: "Internal server error while retrieving profile" 
      });
    }
  }

  /**
   * Get localized message based on language code
   */
  private static getLocalizedMessage(lang: string, messageKey: string): string {
    const messages: Record<string, Record<string, string>> = {
      profileUpdateSuccess: {
        'us': 'Profile updated successfully',
        'en': 'Profile updated successfully', // fallback for en
        'zh': '个人资料更新成功',
        'zh-tw': '個人資料更新成功',
        'fr': 'Profil mis à jour avec succès',
        'es': 'Perfil actualizado exitosamente'
      },
      authRequired: {
        'us': 'Authentication required',
        'en': 'Authentication required',
        'zh': '需要身份验证',
        'zh-tw': '需要身份驗證',
        'fr': 'Authentification requise',
        'es': 'Autenticación requerida'
      },
      invalidData: {
        'us': 'Invalid data',
        'en': 'Invalid data',
        'zh': '数据无效',
        'zh-tw': '資料無效',
        'fr': 'Données invalides',
        'es': 'Datos inválidos'
      },
      userNotFound: {
        'us': 'User not found',
        'en': 'User not found',
        'zh': '用户未找到',
        'zh-tw': '用戶未找到',
        'fr': 'Utilisateur introuvable',
        'es': 'Usuario no encontrado'
      },
      internalError: {
        'us': 'Internal server error while updating profile',
        'en': 'Internal server error while updating profile',
        'zh': '更新个人资料时发生内部服务器错误',
        'zh-tw': '更新個人資料時發生內部伺服器錯誤',
        'fr': 'Erreur de serveur interne lors de la mise à jour du profil',
        'es': 'Error interno del servidor al actualizar el perfil'
      }
    };

    // Default to 'us' if language not supported
    const supportedLang = ['us', 'zh', 'zh-tw', 'fr', 'es'].includes(lang) ? lang : 'us';
    return messages[messageKey]?.[supportedLang] || messages[messageKey]?.['us'] || 'Operation completed';
  }

  /**
   * Update authenticated user profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const lang = (req.query.lang as string) || 'us';

      if (!userId) {
        res.status(401).json({ 
          message: UserController.getLocalizedMessage(lang, 'authRequired')
        });
        return;
      }

      // Validate request body
      const validationResult = updateUserProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          message: UserController.getLocalizedMessage(lang, 'invalidData'),
          errors: validationResult.error.errors
        });
        return;
      }

      const updateData = validationResult.data;
      const storage = await storagePromise;

      // Handle KYC status updates with logging
      if (updateData.kyc_status) {
        Logger.info(`[KYC] Updating status for user ${userId} to: ${updateData.kyc_status}`);
      }

      // Convert date strings to Date objects if present and prepare update payload
      const { kyc_submission_date, kyc_approval_date, ...restUpdateData } = updateData;
      const updatePayload: Partial<UserInterface> = { ...restUpdateData } as Partial<UserInterface>;
      
      if (kyc_submission_date) {
        (updatePayload as any).kyc_submission_date = new Date(kyc_submission_date);
      }
      if (kyc_approval_date) {
        (updatePayload as any).kyc_approval_date = new Date(kyc_approval_date);
      }

      // Update user in database
      const updatedUser = await storage.updateUser(userId, updatePayload);
      
      if (!updatedUser) {
        res.status(404).json({ 
          message: UserController.getLocalizedMessage(lang, 'userNotFound')
        });
        return;
      }

      // Remove sensitive information before sending response
      const userProfile = {
        user_id: updatedUser._id, // Use _id as the user ID
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone_number: updatedUser.phone_number,
        country: updatedUser.country,
        state: updatedUser.state,
        organization_name: updatedUser.organization_name,
        account_status: updatedUser.account_status,
        email_verified: updatedUser.email_verified,
        referral_code: updatedUser.referral_code,
        terms_accepted: updatedUser.terms_accepted,
        last_login: updatedUser.last_login,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      };

      Logger.info(`Profile updated successfully for user ${userId}`);
      Logger.info(`lang ${lang}`);
      res.status(200).json({
        message: UserController.getLocalizedMessage(lang, 'profileUpdateSuccess'),
        user: userProfile
      });

    } catch (error) {
      Logger.error("Update profile error:", error);
      const lang = (req.query.lang as string) || 'us';
      res.status(500).json({ 
        message: UserController.getLocalizedMessage(lang, 'internalError')
      });
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(401).json({ 
          message: "Authentication required" 
        });
        return;
      }

      // Validate request body
      const validationResult = updatePasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors
        });
        return;
      }

      const { old_password, new_password } = validationResult.data;
      const storage = await storagePromise;

      // Get current user to verify old password
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        res.status(404).json({ 
          message: "User not found" 
        });
        return;
      }

      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(old_password, currentUser.password_hash);
      if (!isOldPasswordValid) {
        res.status(400).json({ 
          message: "Current password is incorrect" 
        });
        return;
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

      // Update password in database
      const updatedUser = await storage.updateUser(userId, { 
        password_hash: newPasswordHash 
      });
      
      if (!updatedUser) {
        res.status(404).json({ 
          message: "User not found" 
        });
        return;
      }

      Logger.info(`Password updated successfully for user ${userId}`);

      res.status(200).json({
        message: "Password updated successfully"
      });

    } catch (error) {
      Logger.error("Update password error:", error);
      res.status(500).json({ 
        message: "Internal server error while updating password" 
      });
    }
  }

  /**
   * Check username availability (public endpoint)
   */
  static async checkUsernameAvailability(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = usernameCheckSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.flatten().fieldErrors 
        });
        return;
      }

      const { username } = validationResult.data;

      // Get storage instance and check if username exists in database
      const storage = await storagePromise;
      const existingUser = await storage.getUserByUsername(username);
      
      const isAvailable = !existingUser;

      Logger.info(`Username availability check for "${username}": ${isAvailable ? 'available' : 'taken'}`);

      res.status(200).json({
        available: isAvailable,
        username: username
      });

    } catch (error) {
      Logger.error("Username availability check error:", error);
      res.status(500).json({ 
        message: "Internal server error while checking username availability" 
      });
    }
  }

  /**
   * Update user with Canton party information
   */
  static async updateUserPartyInfo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { username, partyId } = req.body;

      if (!username || !partyId) {
        res.status(400).json({
          message: 'Username and partyId are required',
        });
        return;
      }

      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({
          message: 'User not authenticated',
        });
        return;
      }

      const storage = await storagePromise;

      // Update user with username and partyId
      const updatedUser = await storage.updateUser(userId, {
        username,
        partyId,
      });

      if (!updatedUser) {
        res.status(404).json({
          message: 'User not found',
        });
        return;
      }

      Logger.info(`Updated user ${userId} with username: ${username} and partyId: ${partyId}`);

      res.status(200).json({
        message: 'User party information updated successfully',
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          partyId: updatedUser.partyId,
        },
      });
    } catch (error) {
      Logger.error('Error updating user party information:', error);
      res.status(500).json({
        message: 'Failed to update user party information',
      });
    }
  }

  /**
   * Save onboarding data (supports partial saves for resumable flow)
   */
  static async saveOnboarding(req: ValidatedRequest<OnboardingData> & AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        Logger.warn('Onboarding request without user ID');
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const onboardingData = req.validated;
      const storage = await storagePromise;

      // Check if user wants to skip onboarding
      if (onboardingData.skip === true) {
        await storage.updateUser(userId, { isOnboarded: false });
        res.status(200).json({
          success: true,
          message: 'Onboarding skipped successfully',
          isOnboarded: false
        });
        return;
      }

      const accountType = onboardingData.account_type || onboardingData.userType;
      const updateData: any = {};

      // Update account type if provided
      if (accountType) {
        updateData.account_type = accountType;
        updateData.userType = accountType;
      }

      // Add personal info fields (common for both)
      if (onboardingData.first_name !== undefined) updateData.first_name = onboardingData.first_name;
      if (onboardingData.middle_name !== undefined) updateData.middle_name = onboardingData.middle_name;
      if (onboardingData.last_name !== undefined) updateData.last_name = onboardingData.last_name;
      if (onboardingData.email) updateData.email = onboardingData.email.toLowerCase();
      if (onboardingData.phone_number !== undefined) updateData.phone_number = onboardingData.phone_number;
      if (onboardingData.address1 !== undefined) updateData.address1 = onboardingData.address1;
      if (onboardingData.address2 !== undefined) updateData.address2 = onboardingData.address2;
      if (onboardingData.city !== undefined) updateData.city = onboardingData.city;
      if (onboardingData.country !== undefined) updateData.country = onboardingData.country;
      if (onboardingData.state !== undefined) updateData.state = onboardingData.state;
      if (onboardingData.zipcode !== undefined) updateData.zipcode = onboardingData.zipcode;

      // Add account profile fields (common for both)
      if (onboardingData.purpose_of_account !== undefined) updateData.purpose_of_account = onboardingData.purpose_of_account;
      if (onboardingData.expected_transaction_activity !== undefined) updateData.expected_transaction_activity = onboardingData.expected_transaction_activity;
      if (onboardingData.is_politically_exposed !== undefined) updateData.is_politically_exposed = onboardingData.is_politically_exposed;

      // Add individual account fields
      if (accountType === "individual") {
        if (onboardingData.dob !== undefined) updateData.dob = onboardingData.dob;
        if (onboardingData.profession !== undefined) updateData.profession = onboardingData.profession;
        // Add TIN field for individual accounts (FATCA/CRS)
        if (onboardingData.tin !== undefined) updateData.tin = onboardingData.tin;
      }

      // Add institutional account fields
      if (accountType === "institutional") {
        if (onboardingData.company_name !== undefined) updateData.company_name = onboardingData.company_name;
        if (onboardingData.registration_id !== undefined) updateData.registration_id = onboardingData.registration_id;
        if (onboardingData.company_website !== undefined) updateData.company_website = onboardingData.company_website;
        if (onboardingData.company_phone !== undefined) updateData.company_phone = onboardingData.company_phone;
        if (onboardingData.business_address1 !== undefined) updateData.business_address1 = onboardingData.business_address1;
        if (onboardingData.business_address2 !== undefined) updateData.business_address2 = onboardingData.business_address2;
        if (onboardingData.business_city !== undefined) updateData.business_city = onboardingData.business_city;
        if (onboardingData.business_country !== undefined) updateData.business_country = onboardingData.business_country;
        if (onboardingData.business_state !== undefined) updateData.business_state = onboardingData.business_state;
        if (onboardingData.business_zipcode !== undefined) updateData.business_zipcode = onboardingData.business_zipcode;
        if (onboardingData.authorized_signatory_name !== undefined) updateData.authorized_signatory_name = onboardingData.authorized_signatory_name;
        if (onboardingData.authorized_signatory_email !== undefined) updateData.authorized_signatory_email = onboardingData.authorized_signatory_email;
        if (onboardingData.authorized_signatory_phone !== undefined) updateData.authorized_signatory_phone = onboardingData.authorized_signatory_phone;
      }

      // Only mark as onboarded if all required fields are present (final submission)
      const isComplete = accountType && (
        accountType === "individual" 
          ? !!(updateData.phone_number && updateData.address1 && updateData.city && updateData.country && updateData.state && updateData.dob && updateData.purpose_of_account && updateData.expected_transaction_activity && updateData.is_politically_exposed !== undefined)
          : !!(updateData.company_name && updateData.registration_id && updateData.business_address1 && updateData.business_city && updateData.business_country && updateData.business_state && updateData.authorized_signatory_name && updateData.authorized_signatory_email && updateData.authorized_signatory_phone && updateData.purpose_of_account && updateData.expected_transaction_activity && updateData.is_politically_exposed !== undefined)
      );

      if (isComplete) {
        updateData.isOnboarded = true;
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        Logger.error(`User not found during onboarding: ${userId}`);
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      Logger.info(`Onboarding data saved for user ${userId}, complete: ${isComplete}`);

      // Return all user data for frontend to sync
      delete updatedUser.password_hash;
      delete updatedUser.terms_accepted;
      delete updatedUser.two_factor_enabled;
      delete updatedUser.email_verification_expires;
      delete updatedUser.email_verification_token;

      res.status(200).json({
        success: true,
        message: isComplete ? 'Onboarding completed successfully' : 'Onboarding data saved',
        isOnboarded: isComplete,
        user: updatedUser
      });

    } catch (error) {
      Logger.error('Error saving onboarding data:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while saving onboarding data'
      });
    }
  }
}