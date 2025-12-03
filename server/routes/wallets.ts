import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index.js';

const router = Router();

// Wallet validation schema - only wallet address required
const checkWalletSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required')
});

/**
 * Check if wallet exists in platform
 * POST /api/wallets/check
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = checkWalletSchema.parse(req.body);

    // Check if wallet exists in platform (globally across all users)
    const walletExists = await storage.checkWalletExistsGlobally(walletAddress);

    res.json({
      success: true,
      exists: walletExists,
      walletAddress,
      message: walletExists 
        ? 'Wallet found in platform' 
        : 'Wallet not found in platform'
    });

  } catch (error: any) {
    console.error('Wallet check error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to check wallet existence',
      error: error.message
    });
  }
});

export default router;