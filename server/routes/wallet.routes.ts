import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { addWalletSchema, updateWalletSchema } from '../schemas/wallet.schema';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// All wallet routes require authentication
router.use(requireAuth);

// Add wallet to user profile
router.post('/add', 
  validate(addWalletSchema), 
  asyncHandler(WalletController.addWallet)
);

// Get user's wallets
router.get('/', 
  asyncHandler(WalletController.getWallets)
);

// Update wallet label
router.put('/:id', 
  validate(updateWalletSchema), 
  asyncHandler(WalletController.updateWallet)
);

// Delete wallet
router.delete('/:id', 
  asyncHandler(WalletController.deleteWallet)
);

export default router;