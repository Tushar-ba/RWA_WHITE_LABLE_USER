import { Router } from 'express';
import { BlockchainController, validateMintRequest } from '../controllers/blockchain.controller';
import { blockchainListener } from '../services/blockchain-listener';
import { ENV } from '@shared/constants';

const router = Router();

/**
 * @route POST /api/blockchain/mint
 * @description Execute mint function on blockchain
 * @body {contractAddress, toAddress, amount, gasLimit?, gasPrice?}
 */
router.post('/mint', validateMintRequest, BlockchainController.mint as any);

/**
 * @route GET /api/blockchain/transaction/:txHash
 * @description Get transaction status by hash
 * @param {string} txHash - Transaction hash
 */
router.get('/transaction/:txHash', BlockchainController.getTransactionStatus);

/**
 * @route GET /api/blockchain/wallet/balance
 * @description Get wallet balance
 */
router.get('/wallet/balance', BlockchainController.getWalletBalance);

/**
 * @route GET /api/blockchain/health
 * @description Health check for blockchain service
 */
router.get('/health', BlockchainController.healthCheck);

/**
 * @route GET /api/blockchain/status
 * @description Get blockchain listener status and configuration
 */
router.get('/status', (req, res) => {
  const status = blockchainListener.getStatus();
  res.json({
    success: true,
    message: 'Blockchain listener status',
    data: {
      ...status,
      contracts: {
        gold: process.env.EVM_GOLD_TOKEN_CONTRACT || 'Not configured',
        silver: process.env.EVM_SILVER_TOKEN_CONTRACT || 'Not configured'
      },
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-holesky.g.alchemy.com/v2/EdUntStbXZaSHzY-svGENPy8lkmOh5l2'
    }
  });
});

export { router as blockchainRoutes };