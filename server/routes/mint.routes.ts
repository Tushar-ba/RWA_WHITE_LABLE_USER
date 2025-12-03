import { Router } from 'express';
import { MintController, validateMintTokenRequest } from '../controllers/mint.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireKycApproval } from '../middleware/kyc.middleware';

const router = Router();

/**
 * @route POST /api/mint/tokens
 * @description Mint tokens by converting USD to ETH and calling blockchain function
 * @body {tokenType, amountUsd, userWallet, gasLimit?, gasPrice?}
 */
router.post('/tokens', requireAuth, requireKycApproval, validateMintTokenRequest, MintController.mintTokens as any);

/**
 * @route GET /api/mint/estimate
 * @description Get conversion estimate from USD to ETH
 * @query {amountUsd} - Amount in USD to convert
 */
router.get('/estimate', MintController.getConversionEstimate);

export { router as mintRoutes };