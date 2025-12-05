import { Request, Response } from 'express';
import { SumsubService } from '../services/sumsub.service';
import { storagePromise } from '../storage/index.js';
import { Logger } from '../utils/logger';
import { JWTPayload } from '../services/jwt.service';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

export class KycController {
  /**
   * Initiate KYC process for a user
   */
  static async initiateKyc(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user_id: userId, email } = req.user;
      const storage = await storagePromise;
      
      console.log('[KYC] Initiate KYC for user:', userId, 'email:', email);

      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if KYC already started
      if (user.kyc_status !== 'not_started') {
        res.status(400).json({
          success: false,
          message: 'KYC process already initiated',
          kycStatus: user.kyc_status
        });
        return;
      }

      // Create Sumsub applicant
      const applicantId = await SumsubService.createApplicant(userId, {
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      });

      // Update user with KYC details
      await storage.updateUser(userId, {
        kyc_status: 'pending',
        kyc_applicant_id: applicantId,
        kyc_submission_date: new Date()
      });

      Logger.info(`KYC initiated for user ${userId}, applicant ID: ${applicantId}`);

      res.json({
        success: true,
        message: 'KYC process initiated successfully',
        applicantId,
        kycStatus: 'pending'
      });
    } catch (error: any) {
      Logger.error('Error initiating KYC:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate KYC process',
        error: error.message
      });
    }
  }

  /**
   * Get user's KYC status
   */
  static async getKycStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user_id: userId } = req.user;
      const storage = await storagePromise;
      
      console.log('[KYC] Get KYC status for user:', userId);

      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // If user has applicant ID and status is pending, check with Sumsub
      if (user.kyc_applicant_id && user.kyc_status === 'pending') {
        try {
          const sumsubStatus = await SumsubService.getApplicantStatus(user.kyc_applicant_id);
          const mappedStatus = SumsubService.mapSumsubStatus(
            sumsubStatus.reviewStatus,
            sumsubStatus.reviewResult.reviewAnswer
          );

          // Update user status if it changed
          if (mappedStatus !== user.kyc_status) {
            await storage.updateUser(userId, {
              kyc_status: mappedStatus,
              kyc_approval_date: mappedStatus === 'approved' ? new Date() : undefined,
              kyc_rejection_reason: mappedStatus === 'rejected' ? 
                sumsubStatus.reviewResult.rejectLabels?.join(', ') : undefined
            });
          }

          res.json({
            success: true,
            kycStatus: mappedStatus,
            applicantId: user.kyc_applicant_id,
            submissionDate: user.kyc_submission_date,
            approvalDate: user.kyc_approval_date,
            rejectionReason: user.kyc_rejection_reason
          });
        } catch (error) {
          Logger.error('Error checking Sumsub status:', error);
          // Return current status from database
          res.json({
            success: true,
            kycStatus: user.kyc_status,
            applicantId: user.kyc_applicant_id,
            submissionDate: user.kyc_submission_date,
            approvalDate: user.kyc_approval_date,
            rejectionReason: user.kyc_rejection_reason
          });
        }
      } else {
        res.json({
          success: true,
          kycStatus: user.kyc_status,
          applicantId: user.kyc_applicant_id,
          submissionDate: user.kyc_submission_date,
          approvalDate: user.kyc_approval_date,
          rejectionReason: user.kyc_rejection_reason
        });
      }
    } catch (error: any) {
      Logger.error('Error getting KYC status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get KYC status',
        error: error.message
      });
    }
  }

  /**
   * Get access token for Sumsub SDK
   */
  static async getAccessToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user_id: userId, email } = req.user;
      const storage = await storagePromise;
      
      console.log('[KYC] Generate access token for WebSDK directly');

      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Determine verification level based on user type
      const userType = user.account_type || user.userType || 'individual';
      const levelName = SumsubService.getVerificationLevel(userType as 'individual' | 'institutional');
      
      console.log(`[KYC] User type: ${userType}, using level: ${levelName}`);

      try {
        // Generate Sumsub access token with appropriate level
        const accessToken = await SumsubService.generateSDKAccessToken(
          userId,
          { 
            email: user.email, 
            phone: user.phone_number || undefined 
          },
          levelName,
          600 // 10 minutes
        );

        res.json({
          success: true,
          accessToken,
          userId: userId,
          userType: userType,
          levelName: levelName
        });
      } catch (error: any) {
        Logger.error('Failed to generate Sumsub access token:', error);
        
        // If it fails, provide helpful error message
        if (error.message.includes('Level') && error.message.includes('not found')) {
          const setupMessage = userType === 'institutional' 
            ? `❌ SUMSUB COMPANY VERIFICATION LEVEL NEEDED\n\n` +
              `Your Sumsub account needs the "${levelName}" verification level configured:\n\n` +
              `📋 QUICK SETUP:\n` +
              `1. Login to https://cockpit.sumsub.com/\n` +
              `2. Go to "Levels" section\n` +
              `3. Create a new level for Companies\n` +
              `4. Name it "${levelName}"\n` +
              `5. Configure required company documents\n` +
              `6. Save and activate the level\n\n` +
              `💡 Documentation: https://docs.sumsub.com/docs/verification-levels`
            : `❌ SUMSUB CONFIGURATION NEEDED\n\n` +
              `Your Sumsub account needs a verification level configured:\n\n` +
              `📋 QUICK SETUP:\n` +
              `1. Login to https://cockpit.sumsub.com/\n` +
              `2. Go to "Levels" section\n` +
              `3. Create a basic verification level named "${levelName}"\n` +
              `4. Configure required documents (ID, Selfie)\n` +
              `5. Save and activate the level\n\n` +
              `💡 Once configured, KYC will work automatically.`;
          
          res.status(400).json({
            success: false,
            message: setupMessage
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Failed to generate access token',
            error: error.message
          });
        }
      }
    } catch (error: any) {
      Logger.error('Error in access token endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process request',
        error: error.message
      });
    }
  }

  /**
   * Handle Sumsub webhook notifications
   */
  static async handleWebhook(req: any, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-payload-digest'] as string;
      const payload = req.body;
      const algo = req.headers['X-Payload-Digest-Alg']
      // console.log('signature', signature);
      // Verify webhook
      // await SumsubService.handleWebhook(Buffer.from(JSON.stringify(payload)), signature,algo);

      if (payload.type === 'applicantReviewed') {
        const { applicantId, externalUserId,reviewStatus, reviewResult } = payload;
        const storage = await storagePromise;
        console.log('payload', payload);
        // Find user by applicant ID - use direct MongoDB query
        let foundUser = null;
        try {
          // Access the MongoDB database directly to find user by kyc_applicant_id
          const db = (storage as any).db;
          if (db) {
            foundUser = await db.collection('users').findOne({ _id: new ObjectId(externalUserId) });
          }
        } catch (error) {
          Logger.warn('Could not find user by applicant ID:', error);
        }
        
        if (!foundUser) {
          Logger.warn(`No user found for applicant ID: ${applicantId}`);
          res.status(200).json({ success: true });
          return;
        }
        
        const webhookUser = foundUser;
        const mappedStatus = SumsubService.mapSumsubStatus(reviewStatus, reviewResult.reviewAnswer);

        // KYC auto-approval via webhook disabled:
        // We still compute mappedStatus for logging/monitoring,
        // but do not persist it to the user record.
        // await storage.updateUser(webhookUser._id!.toString(), {
        //   kyc_status: mappedStatus,
        //   kyc_approval_date: mappedStatus === 'approved' ? new Date() : undefined,
        //   kyc_rejection_reason: mappedStatus === 'rejected' ? 
        //     reviewResult.rejectLabels?.join(', ') : undefined
        // });

        // Logger.info(`Updated KYC status for user ${webhookUser._id}: ${mappedStatus}`);
      }

      res.status(200).json({ success: true });
    } catch (error: any) {
      Logger.error('Error handling Sumsub webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process webhook',
        error: error.message
      });
    }
  }

  /**
   * Generate SDK access token for WebSDK initialization
   * Using standard WebSDK flow instead of external links
   */
  static async generateExternalLink(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { user_id: userId, email } = req.user;
      const storage = await storagePromise;
      
      console.log('[KYC] Generate SDK access token for user:', userId, 'email:', email);

      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if user already completed KYC
      if (user.kyc_status === 'approved') {
        res.status(400).json({
          success: false,
          message: 'KYC already completed',
          kycStatus: user.kyc_status
        });
        return;
      }

      console.log('[KYC] Generating SDK access token for WebSDK');

      // Determine verification level based on user type
      const userType = user.account_type || user.userType || 'individual';
      const levelName = SumsubService.getVerificationLevel(userType as 'individual' | 'institutional');
      
      console.log(`[KYC] User type: ${userType}, using level: ${levelName}`);
      
      let accessToken: string;
      try {
        accessToken = await SumsubService.generateSDKAccessToken(
          userId,
          {
            email: user.email,
            phone: user.phone_number
          },
          levelName,
          600
        );
      } catch (error: any) {
        // If level doesn't exist, provide clear instructions
        if (error.message.includes('not found') || error.message.includes('404')) {
          const setupMessage = userType === 'institutional'
            ? `❌ COMPANY VERIFICATION LEVEL REQUIRED\n\n` +
              `Your Sumsub account needs the "${levelName}" verification level for company verification.\n\n` +
              `📋 SETUP STEPS:\n` +
              `1. Login to your Sumsub dashboard: https://cockpit.sumsub.com/\n` +
              `2. Go to "Levels" section\n` +
              `3. Create a new level for Companies named "${levelName}"\n` +
              `4. Configure the required company documents and steps\n` +
              `5. Save and activate the level\n\n` +
              `💡 Documentation: https://docs.sumsub.com/docs/verification-levels`
            : `❌ VERIFICATION LEVEL REQUIRED\n\n` +
              `Your Sumsub account needs a verification level to be configured.\n\n` +
              `📋 SETUP STEPS:\n` +
              `1. Login to your Sumsub dashboard: https://cockpit.sumsub.com/\n` +
              `2. Go to "Levels" section\n` +
              `3. Create a new level named "${levelName}"\n` +
              `4. Configure the required documents and steps\n` +
              `5. Save and activate the level\n\n` +
              `💡 Once the level is created, KYC verification will work automatically.`;
          
          throw new Error(setupMessage);
        }
        throw error;
      }

      // Update user KYC status to pending if not started
      if (user.kyc_status === 'not_started') {
        await storage.updateUser(userId, {
          kyc_status: 'pending',
          kyc_submission_date: new Date()
        });
      }

      Logger.info(`Generated SDK access token for user ${userId} (${userType})`);

      res.json({
        success: true,
        message: 'SDK access token generated successfully',
        accessToken,
        kycStatus: 'pending',
        expiresIn: 600,
        userType: userType,
        levelName: levelName,
        // Return user info for SDK initialization
        userInfo: {
          userId,
          email: user.email,
          phone: user.phone_number
        }
      });
    } catch (error: any) {
      Logger.error('Error generating SDK access token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate SDK access token',
        error: error.message
      });
    }
  }

  /**
   * Get KYC configuration for frontend
   */
  static async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = SumsubService.getClientConfig();
      res.json({
        success: true,
        config
      });
    } catch (error: any) {
      Logger.error('Error getting KYC config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get KYC configuration',
        error: error.message
      });
    }
  }
}