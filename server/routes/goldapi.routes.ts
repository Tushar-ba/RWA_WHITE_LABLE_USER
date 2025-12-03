import { Router, Request, Response } from 'express';
import { goldApiService } from '../services/goldapi.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/metals/gold
 * @desc    Get current Gold price in USD
 * @access  Protected
 */
router.get('/gold', requireAuth, async (req: Request, res: Response) => {
  try {
    const goldPrice = await goldApiService.getGoldPrice();
    
    res.status(200).json({
      success: true,
      message: 'Gold price fetched successfully',
      data: {
        ...goldPrice,
        timestamp: new Date(goldPrice.timestamp * 1000).toISOString(),
        source: 'goldapi'
      }
    });
  } catch (error: any) {
    console.error('Error fetching gold price:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch gold price',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   GET /api/metals/silver
 * @desc    Get current Silver price in USD
 * @access  Protected
 */
router.get('/silver', requireAuth, async (req: Request, res: Response) => {
  try {
    const silverPrice = await goldApiService.getSilverPrice();
    
    res.status(200).json({
      success: true,
      message: 'Silver price fetched successfully',
      data: {
        ...silverPrice,
        timestamp: new Date(silverPrice.timestamp * 1000).toISOString(),
        source: 'goldapi'
      }
    });
  } catch (error: any) {
    console.error('Error fetching silver price:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch silver price',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   GET /api/metals/both
 * @desc    Get both Gold and Silver prices in USD
 * @access  Protected
 */
router.get('/both', requireAuth, async (req: Request, res: Response) => {
  try {
    const bothPrices = await goldApiService.getBothPrices();
    
    res.status(200).json({
      success: true,
      message: 'Both prices fetched successfully',
      data: {
        gold: {
          ...bothPrices.gold,
          timestamp: new Date(bothPrices.gold.timestamp * 1000).toISOString()
        },
        silver: {
          ...bothPrices.silver,
          timestamp: new Date(bothPrices.silver.timestamp * 1000).toISOString()
        },
        source: 'goldapi'
      }
    });
  } catch (error: any) {
    console.error('Error fetching both prices:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch precious metal prices',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   GET /api/metals/health
 * @desc    Health check for Gold API integration
 * @access  Public
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Simple health check - just try to fetch gold price
    const goldPrice = await goldApiService.getGoldPrice();
    
    res.status(200).json({
      success: true,
      message: 'Gold API integration is healthy',
      data: {
        status: 'healthy',
        lastPrice: goldPrice.price,
        metal: goldPrice.metal,
        timestamp: new Date(goldPrice.timestamp * 1000).toISOString()
      }
    });
  } catch (error: any) {
    console.error('Gold API health check failed:', error);
    
    res.status(503).json({
      success: false,
      message: 'Gold API integration is unhealthy',
      data: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;