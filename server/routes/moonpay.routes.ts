import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireKycApproval } from '../middleware/kyc.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { Logger } from '../utils/logger';
import { storagePromise } from '../storage';
import { MoonPayService } from '../services/moonpay.service';
import crypto from 'crypto';

const router = Router();

/**
 * @route POST /api/moonpay/create-payment-url
 * @description Generate signed MoonPay payment URL
 * @auth Required, KYC Required
 */
router.post('/create-payment-url', requireAuth, requireKycApproval, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user_id: userId } = req.user;
    const {
      currencyCode = 'usdc_sepolia',
      baseCurrencyAmount,
      baseCurrencyCode = 'usd',
      walletAddress,
      externalTransactionId,
      externalCustomerId
    } = req.body;

    if (!baseCurrencyAmount) {
      return res.status(400).json({
        success: false,
        message: 'baseCurrencyAmount are required'
      });
    }

    const moonPayService = MoonPayService.getInstance();
    
    const signedUrl = moonPayService.generateSignedUrl({
      currencyCode,
      baseCurrencyAmount: parseFloat(baseCurrencyAmount),
      baseCurrencyCode,
      walletAddress:'0xaB4dbDD5Fb141E08Da7b3E77C08fc706aF2D1Fcc',
      externalTransactionId,
      externalCustomerId
    });

    res.json({
      success: true,
      data: {
        paymentUrl: signedUrl
      }
    });
    
  } catch (error: any) {
    Logger.error('Error creating MoonPay payment URL:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment URL'
    });
  }
}));

/**
 * @route POST /moonpay-webhook
 * @description Handle MoonPay webhook events
 */
router.post('/moonpay-webhook', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log("WEBHOOK RECEIVED")
    
    // Verify webhook signature using the correct header name
    const signature = req.headers['moonpay-signature-v2'] as string;
    const payload = JSON.stringify(req.body);
    
    if (signature) {
      const moonPayService = MoonPayService.getInstance();
      const isValidSignature = moonPayService.verifyWebhookSignature(payload, signature);
      
      if (!isValidSignature) {
        Logger.warn('Invalid MoonPay webhook signature');
        return res.status(401).json({ message: 'Invalid signature' });
      }
    } else {
      Logger.warn('No MoonPay signature header found in webhook request');
    }
    
    Logger.info('MoonPay webhook received:', { 
      type: req.body.type, 
      transactionId: req.body.data?.id,
      status: req.body.data?.status 
    });
    
    const {
      data: {
        id: moonpayTransactionId,
        status,
        cryptoTransactionId,
        walletAddress,
        baseCurrencyAmount,
        quoteCurrencyAmount,
        externalTransactionId,
        feeAmount,
        failureReason,
        paymentMethod
      },
      type,
      externalCustomerId,
    } = req.body;

    const storage = await storagePromise;

    // Handle different webhook event types
    if (type === 'transaction_created') {
      Logger.info(`MoonPay transaction created: ${moonpayTransactionId}`);
      
      // Update purchase record to processing if externalTransactionId exists
      if (externalTransactionId) {
        try {
          const ObjectId = (await import('mongodb')).ObjectId;
          if (ObjectId.isValid(externalTransactionId)) {
            await storage.updatePurchaseHistory(externalTransactionId, {
              status: 'processing',
              updatedAt: new Date()
            });
            Logger.info(`Updated purchase record ${externalTransactionId} to processing status`);
          }
        } catch (error) {
          Logger.error('Error updating purchase record to processing:', error);
        }
      }
      
    } else if (type === 'transaction_updated') {
      Logger.info(`MoonPay transaction updated: ${moonpayTransactionId}, status: ${status}`);
      
      if (status === 'completed' && cryptoTransactionId && externalTransactionId) {
        // Transaction completed successfully
        try {
          const ObjectId = (await import('mongodb')).ObjectId;
          if (ObjectId.isValid(externalTransactionId)) {
            // Check if already processed to prevent duplicates
            const existingTx = await storage.getPurchaseHistoryByTransactionHash(cryptoTransactionId);
            if (existingTx) {
              Logger.info(`Transaction ${cryptoTransactionId} already processed`);
              return res.status(200).json({ message: 'Transaction already processed' });
            }

            await storage.updatePurchaseHistory(externalTransactionId, {
              status: 'pending',
              transactionHash: cryptoTransactionId,
              updatedAt: new Date()
            });

            Logger.info(`✅ Updated purchase record ${externalTransactionId} - MoonPay transaction ${moonpayTransactionId} completed with crypto tx: ${cryptoTransactionId}`);
          }
        } catch (error) {
          Logger.error('Error updating completed purchase record:', error);
        }
      }
      
    } else if (type === 'transaction_failed') {
      Logger.warn(`MoonPay transaction failed: ${moonpayTransactionId}, reason: ${failureReason}`);
      
      if (externalTransactionId) {
        try {
          const ObjectId = (await import('mongodb')).ObjectId;
          if (ObjectId.isValid(externalTransactionId)) {
            await storage.updatePurchaseHistory(externalTransactionId, {
              status: 'failed',
              errorMessage: failureReason || 'MoonPay transaction failed',
              updatedAt: new Date()
            });
            
            Logger.info(`Updated purchase record ${externalTransactionId} to failed status`);
          }
        } catch (error) {
          Logger.error('Error updating failed purchase record:', error);
        }
      }
    }

    res.status(200).json({ message: 'MoonPay webhook processed successfully' });
    
  } catch (error: any) {
    Logger.error('Error processing MoonPay webhook:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process MoonPay webhook'
    });
  }
}));

/**
 * @route POST /helio-webhook
 * @description Handle Helio webhook events
 */
router.post('/helio-webhook', asyncHandler(async (req: Request, res: Response) => {
  try {
    Logger.info('Helio webhook received:', { 
      event: req.body.event,
      transactionId: req.body.transactionObject?.id,
      paylinkId: req.body.transactionObject?.paylinkId
    });
    
    const {
      event,
      transactionObject
    } = req.body;
    if (event === 'CREATED' && transactionObject) {
      const {
        id: helioTransactionId,
        paylinkId,
        fee,
        quantity,
        createdAt,
        paymentType,
        meta
      } = transactionObject;
      
      const {
        amount,
        senderPK,
        recipientPK,
        transactionSignature,
        transactionStatus,
        totalAmount,
        totalAmountAsUSD,
        currency
      } = meta || {};
      
      const storage = await storagePromise;
      
      // Calculate fee and amount values
      const feeInUsd = fee ? (parseFloat(fee) / Math.pow(10, 12)).toString() : '0'; // Convert from wei (12 decimals)
      const totalAmountUsd = totalAmountAsUSD ? (parseFloat(totalAmountAsUSD) / 1000000).toString() : '0'; // Convert from micro-cents
      
      // Try to find existing purchase record by transactionHash (Helio transaction ID)
      let purchaseRecord = null;
      
      try {
        // purchaseRecord = await storage.getPurchaseHistoryByTransactionHash(helioTransactionId);
        
        if (transactionSignature) {
          // Also try with transaction signature
          purchaseRecord = await storage.getPurchaseHistoryByTransactionHash(transactionSignature);
        }
      } catch (error) {
        Logger.error('Error finding purchase record by transaction hash:', error);
      }
      Logger.info('🔍 Purchase record search result:', { 
        found: !!purchaseRecord, 
        purchaseId: purchaseRecord?._id,
        transactionSearchKey: transactionSignature || helioTransactionId
      });
      if (purchaseRecord && purchaseRecord._id) {
        // Update existing purchase record
        await storage.updatePurchaseHistory(purchaseRecord._id.toString(), {
          status: 'pending', // Set status to pending as requested
          transactionHash: transactionSignature || helioTransactionId,
          feeAmount: feeInUsd,
          usdAmount: totalAmountUsd,
          updatedAt: new Date()
        });
        
        Logger.info(`✅ Updated existing purchase record ${purchaseRecord._id} with Helio transaction details`, {
          helioTransactionId,
          transactionSignature,
          transactionStatus,
          totalAmountUsd,
          feeInUsd
        });
        
      } else {
        // Log transaction details for manual processing since we can't create records without user context
        Logger.warn('No matching purchase record found for Helio transaction - transaction details logged for manual processing', {
          paylinkId,
          helioTransactionId,
          senderPK,
          recipientPK,
          totalAmountUsd,
          feeInUsd,
          transactionSignature,
          transactionStatus
        });
      }
    }
    
    res.status(200).json({ message: 'Helio webhook processed successfully' });
    
  } catch (error: any) {
    Logger.error('Error processing Helio webhook:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process Helio webhook'
    });
  }
}));

export default router;