import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireKycApproval } from '../middleware/kyc.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { TransakService } from '../services/transak.service';
import { Logger } from '../utils/logger';
import { storagePromise } from '../storage';

const router = Router();

/**
 * @route POST /api/transak/refresh-token
 * @description Get or refresh Transak access token
 * @auth Required
 */
router.post('/refresh-token', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accessToken = await TransakService.getAccessToken();
    
    res.json({
      success: true,
      data: {
        access_token: accessToken,
        token_type: 'Bearer'
      }
    });
  } catch (error: any) {
    Logger.error('Error refreshing Transak access token:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to refresh access token'
    });
  }
}));

/**
 * @route POST /api/transak/create-session
 * @description Create a Transak payment session
 * @auth Required, KYC Required
 */
router.post('/create-session', requireAuth, requireKycApproval, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user_id: userId, email } = req.user;
    const { 
      fiatCurrency, 
      cryptoCurrency, 
      fiatAmount,
      cryptoAmount,
      walletAddress, 
      purchaseHistoryId,
      mode,
      sessionId
    } = req.body;

    if (!fiatCurrency || !cryptoCurrency || !walletAddress || !purchaseHistoryId) {
      return res.status(400).json({
        success: false,
        message: 'fiatCurrency, cryptoCurrency, walletAddress, and purchaseHistoryId are required'
      });
    }

    if (!fiatAmount && !cryptoAmount) {
      return res.status(400).json({
        success: false,
        message: 'Either fiatAmount or cryptoAmount is required'
      });
    }

    // Get user details
    const storage = await storagePromise;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create Transak session
    const session = await TransakService.createSession({
      fiatCurrency,
      cryptoCurrency,
      fiatAmount: fiatAmount ? parseFloat(fiatAmount) : undefined,
      cryptoAmount: cryptoAmount ? parseFloat(cryptoAmount) : undefined,
      walletAddress,
      email: email,
      partnerCustomerId:mode === 'BUY' ? userId :'68ac305e3d05da093f297f4f',
      mode: mode || 'BUY',
      themeColor: '#D4AF37', // Vaulted Assets gold color
      redirectURL: `${process.env.TRANSAK_BASE_URL || 'https://dev-user.mits.net'}/assets?purchase=${purchaseHistoryId}`,
      sessionId:sessionId,
      webhookURL: `${'https://dev-user.mits.net'
}/api/transak/webhooks`
    });

    // Generate redirect URL
    const redirectUrl = TransakService.getRedirectUrl(session.session_id);

    res.json({
      success: true,
      data: {
        sessionId: session.session_id,
        redirectUrl: mode === 'BUY' ? `${redirectUrl}&productsAvailed=BUY` : `${redirectUrl}&productsAvailed=SELL`
      }
    });

  } catch (error: any) {
    Logger.error('Error creating Transak session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create session'
    });
  }
}));

/**
 * @route POST /api/transak/webhook
 * @description Handle Transak webhook events
 */
router.post('/webhook', asyncHandler(async (req: any, res: Response) => {
  try {
    Logger.info('Transak webhook received:', req.body);
    
    // Extract encrypted data from webhook payload
    const { data: encryptedData } = req.body;
    
    if (!encryptedData) {
      Logger.error('No encrypted data found in Transak webhook');
      return res.status(400).json({
        success: false,
        message: 'No encrypted data found in webhook payload'
      });
    }

    // Decrypt the webhook payload
    const webhookData = await TransakService.decryptWebhookPayload(encryptedData);
    
    Logger.info('Transak webhook decrypted:', {
      eventType: webhookData.eventType,
      eventID: webhookData.eventID,
      id: webhookData.id,
      status: webhookData.status,
      partnerCustomerId: webhookData.partnerCustomerId,
      fiatAmount: webhookData.fiatAmount,
      cryptoAmount: webhookData.cryptoAmount
    });

    // Map Transak status to our internal status
    const internalStatus = TransakService.mapTransakStatusToPurchaseStatus(webhookData.status);
    
    // Find and update purchase history using partnerCustomerId (which should be the purchase ID)
    const storage = await storagePromise;
    
    // Try to find purchase by different methods
    let purchaseRecord = null;
    
    // Method 1: Try finding by user ID and matching transaction details
    if (webhookData.partnerCustomerId) {
      try {
        // Get user's recent purchases and match by amount and status
        const userPurchases = await storage.getPurchaseHistoryByUserPaginated(webhookData.partnerCustomerId, 0, 10);
        purchaseRecord = userPurchases.purchases.find((p: any) => 
          p.status === 'initiated' && 
          Math.abs(parseFloat(p.usdAmount) - webhookData.fiatAmount) < 0.01
        );
      } catch (error) {
        Logger.info('Could not find purchase by user lookup');
      }
    }
    
    // Method 2: Try finding by transaction hash if available
    if (!purchaseRecord && webhookData.transactionHash) {
      try {
        purchaseRecord = await storage.getPurchaseHistoryByTransactionHash(webhookData.transactionHash);
      } catch (error) {
        Logger.info('Purchase not found by transaction hash');
      }
    }

    if (purchaseRecord) {
      // Update the purchase status
      const updateData: any = {
        status: internalStatus,
        updatedAt: new Date()
      };

      // Add transaction hash if completed
      if (webhookData.transactionHash && internalStatus === 'completed') {
        updateData.transactionHash = webhookData.transactionHash;
      }

      // Add completion timestamp if completed
      if (internalStatus === 'completed' && webhookData.completedAt) {
        updateData.completedAt = new Date(webhookData.completedAt);
      }

      await storage.updatePurchaseHistory(purchaseRecord._id?.toString() || '', updateData);

      Logger.info(`Updated purchase history ${purchaseRecord._id} from ${purchaseRecord.status} to ${internalStatus}`, {
        purchaseId: purchaseRecord._id,
        oldStatus: purchaseRecord.status,
        newStatus: internalStatus,
        transakOrderId: webhookData.id,
        eventType: webhookData.eventType
      });
    } else {
      Logger.warn('Could not find purchase history record for Transak webhook', {
        partnerCustomerId: webhookData.partnerCustomerId,
        transakOrderId: webhookData.id,
        eventType: webhookData.eventType
      });
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error: any) {
    Logger.error('Error processing Transak webhook:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process webhook'
    });
  }
}));

export default router;