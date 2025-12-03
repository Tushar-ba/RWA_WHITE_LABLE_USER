import { Router } from 'express';
import { TransactionHistoryController } from '../controllers/transaction-history.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// Apply authentication to all transaction history routes
router.use(requireAuth);

// Get combined transaction history with pagination, filtering, and search
router.get('/', 
  asyncHandler(TransactionHistoryController.getCombinedTransactionHistory)
);

// Export transaction history data
router.get('/export', 
  asyncHandler(TransactionHistoryController.exportTransactionHistory)
);

export { router as transactionHistoryRoutes };