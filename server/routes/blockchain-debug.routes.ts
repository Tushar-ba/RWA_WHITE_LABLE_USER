import { Router } from 'express';
import { blockchainListener } from '../services/blockchain-listener.js';
import { Logger } from '../utils/logger.js';

const router = Router();

/**
 * @route POST /api/blockchain-debug/process-transaction
 * @description Manually process a specific transaction hash for missed events
 * @body {transactionHash: string}
 */
router.post('/process-transaction', async (req, res) => {
  try {
    const { transactionHash } = req.body;

    if (!transactionHash) {
      return res.status(400).json({
        success: false,
        message: 'Transaction hash is required'
      });
    }

    Logger.info(`Manual processing requested for transaction: ${transactionHash}`);

    // Process the specific transaction
    const result = await (blockchainListener as any).processSpecificTransaction(transactionHash);

    if (result) {
      res.json({
        success: true,
        message: 'Transaction processed successfully',
        transactionHash
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to process transaction',
        transactionHash
      });
    }
  } catch (error) {
    Logger.error('Error in manual transaction processing:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/blockchain-debug/restart-listener
 * @description Restart the blockchain listener to process recent blocks
 */
router.post('/restart-listener', async (req, res) => {
  try {
    Logger.info('Restarting blockchain listener...');

    // Stop current listener
    await blockchainListener.stopListening();
    
    // Start fresh to catch recent blocks
    await blockchainListener.startListening();

    res.json({
      success: true,
      message: 'Blockchain listener restarted successfully'
    });
  } catch (error) {
    Logger.error('Error restarting blockchain listener:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restart blockchain listener',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;