import { Router, Request, Response } from 'express';
import { coinGeckoService } from '../services/coingecko.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/prices/ethereum
 * @desc    Get current ETH price in USD
 * @access  Protected
 */
router.get('/ethereum', requireAuth, async (req: Request, res: Response) => {
  try {
    const ethPrice = await coinGeckoService.getEthereumPrice();
    
    res.status(200).json({
      success: true,
      message: 'ETH price fetched successfully',
      data: {
        price: ethPrice,
        currency: 'usd',
        timestamp: new Date().toISOString(),
        source: 'coingecko'
      }
    });
  } catch (error: any) {
    console.error('Error fetching ETH price:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch ETH price',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   GET /api/prices/multiple
 * @desc    Get prices for multiple cryptocurrencies
 * @access  Protected
 * @query   coins - Comma-separated list of coin IDs (default: ethereum,bitcoin)
 * @query   currencies - Comma-separated list of currencies (default: usd)
 */
router.get('/multiple', requireAuth, async (req: Request, res: Response) => {
  try {
    const { coins = 'ethereum,bitcoin', currencies = 'usd' } = req.query;
    
    // Parse query parameters
    const coinIds = typeof coins === 'string' ? coins.split(',').map(c => c.trim()) : ['ethereum'];
    const vsCurrencies = typeof currencies === 'string' ? currencies.split(',').map(c => c.trim()) : ['usd'];
    
    // Validate coin IDs (basic validation)
    const validCoinIds = coinIds.filter(id => /^[a-z0-9-]+$/.test(id));
    if (validCoinIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coin IDs provided'
      });
    }
    
    const prices = await coinGeckoService.getMultiplePrices(validCoinIds, vsCurrencies);
    
    res.status(200).json({
      success: true,
      message: 'Prices fetched successfully',
      data: {
        prices,
        coins: validCoinIds,
        currencies: vsCurrencies,
        timestamp: new Date().toISOString(),
        source: 'coingecko'
      }
    });
  } catch (error: any) {
    console.error('Error fetching multiple prices:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cryptocurrency prices',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   GET /api/prices/health
 * @desc    Health check for CoinGecko API integration
 * @access  Public
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Simple health check - just try to fetch ETH price
    const ethPrice = await coinGeckoService.getEthereumPrice();
    
    res.status(200).json({
      success: true,
      message: 'CoinGecko API integration is healthy',
      data: {
        status: 'healthy',
        lastPrice: ethPrice,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('CoinGecko health check failed:', error);
    
    res.status(503).json({
      success: false,
      message: 'CoinGecko API integration is unhealthy',
      data: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;