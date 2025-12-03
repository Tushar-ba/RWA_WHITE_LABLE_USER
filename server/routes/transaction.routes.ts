import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// Apply authentication to all transaction routes
router.use(requireAuth);

// Get user's transaction history with pagination and filtering
router.get('/', 
  asyncHandler(TransactionController.getTransactions)
);

// Get specific transaction by ID
router.get('/:id', 
  asyncHandler(TransactionController.getTransaction)
);

export { router as transactionRoutes };