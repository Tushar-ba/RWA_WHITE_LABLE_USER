import { Router, Request, Response } from 'express';
import { insertGiftingSchema, type InsertGifting } from '@shared/schema';
import { storage } from '../storage/index.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireKycApproval } from '../middleware/kyc.middleware';

const router = Router();

/**
 * Create a new gifting record or update existing one if transactionHash exists
 * POST /api/gifting
 */
router.post('/', requireAuth, requireKycApproval, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // REQUIRED: Use findOne with populate instead of separate getUserInfo query
    const userInfo = await storage.getUserInfo(userId);
    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate the request body with correct userId
    const giftingData = insertGiftingSchema.parse({
      ...req.body,
      userId: userId
    });

    let gifting;
    let isUpdate = false;
    
    // Check if a record with the same transactionHash already exists
    // Skip update logic for private network "unknown" hashes to always create new records
    if (giftingData.transactionHash && giftingData.transactionHash !== "unknown") {
      const existingGifting = await storage.getGiftingByTransactionHash(giftingData.transactionHash);
      
      if (existingGifting) {
        // Update existing record
        gifting = await storage.updateGifting(existingGifting._id!, {
          recipientWallet: giftingData.recipientWallet,
          token: giftingData.token,
          quantity: giftingData.quantity,
          message: giftingData.message,
          network: giftingData.network,
          status: giftingData.status,
          errorMessage: giftingData.errorMessage,
          networkFee: giftingData.networkFee,
          tokenValueUSD: giftingData.tokenValueUSD,
          platformFeeUSD: giftingData.platformFeeUSD,
          totalCostUSD: giftingData.totalCostUSD,
          gramsAmount: giftingData.gramsAmount,
          currentTokenPrice: giftingData.currentTokenPrice
        });
        isUpdate = true;
      } else {
        // Create new record
        gifting = await storage.createGifting(giftingData);
      }
    } else {
      // Create new record (no transactionHash provided or "unknown" hash)
      // Generate unique hash for private network transactions
      if (giftingData.transactionHash === "unknown") {
        giftingData.transactionHash = `private_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      gifting = await storage.createGifting(giftingData);
    }

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Gifting record updated successfully' : 'Gifting record created successfully',
      data: gifting
    });

  } catch (error: any) {
    console.error('Create/Update gifting error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid gifting data',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create/update gifting record',
      error: error.message
    });
  }
});


/**
 * Get gifting history for authenticated user with pagination
 * GET /api/gifting?page=1&limit=10
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get gifting history with pagination using enhanced storage method
    const { giftings, total } = await storage.getGiftingsWithUserInfoPaginated(userId, skip, limit);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: 'Gifting history retrieved successfully',
      data: giftings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('Get giftings error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve gifting history',
      error: error.message
    });
  }
});

export default router;