import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolio.controller';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// Apply authentication to all portfolio routes
router.use(requireAuth);

// Get user's portfolio
router.get('/', 
  asyncHandler(PortfolioController.getPortfolio)
);



export { router as portfolioRoutes };