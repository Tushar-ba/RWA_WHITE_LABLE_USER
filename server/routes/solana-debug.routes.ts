import { Router, Request, Response } from 'express';
import { SolanaBlockchainListener } from '../services/solana-listener';

const router = Router();
let solanaListener: SolanaBlockchainListener;

// Initialize the listener instance
const initSolanaListener = async () => {
  if (!solanaListener) {
    solanaListener = new SolanaBlockchainListener();
    await solanaListener.initializeProgram();
  }
  return solanaListener;
};

/**
 * Process a specific transaction for debugging
 */
router.post('/process-transaction', async (req: Request, res: Response) => {
  try {
    const { signature } = req.body;
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Transaction signature is required'
      });
    }

    const listener = await initSolanaListener();
    await listener.processMissedTransaction(signature);

    res.json({
      success: true,
      message: `Processing transaction ${signature} - check server logs for details`
    });

  } catch (error) {
    console.error('Error in process-transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process transaction',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Decode program data from base64
 */
router.post('/decode-program-data', async (req: Request, res: Response) => {
  try {
    const { programData } = req.body;
    
    if (!programData) {
      return res.status(400).json({
        success: false,
        message: 'Program data (base64) is required'
      });
    }

    // Decode the base64 program data
    const buffer = Buffer.from(programData, 'base64');
    const hexData = buffer.toString('hex');
    
    // Check discriminators
    const redemptionRequestedDiscriminator = [245, 155, 98, 131, 210, 25, 137, 146];
    const actualDiscriminator = Array.from(buffer.slice(0, 8));
    
    const isRedemptionRequested = JSON.stringify(actualDiscriminator) === JSON.stringify(redemptionRequestedDiscriminator);
    
    let eventData: any = null;
    
    if (isRedemptionRequested) {
      // Parse RedemptionRequested event data
      // Structure: discriminator (8 bytes) + user (32 bytes) + request_id (8 bytes) + amount (8 bytes) + timestamp (8 bytes)
      const userBytes = buffer.slice(8, 40);
      const requestIdBytes = buffer.slice(40, 48);
      const amountBytes = buffer.slice(48, 56);
      const timestampBytes = buffer.slice(56, 64);
      
      eventData = {
        user: Array.from(userBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
        request_id: requestIdBytes.readBigUInt64LE(0).toString(),
        amount: amountBytes.readBigUInt64LE(0).toString(),
        timestamp: timestampBytes.readBigInt64LE(0).toString()
      };
    }

    res.json({
      success: true,
      data: {
        hexData,
        length: buffer.length,
        discriminator: actualDiscriminator,
        isRedemptionRequested,
        eventData
      }
    });

  } catch (error) {
    console.error('Error decoding program data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decode program data',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Process historic events in a specific slot range
 */
router.post('/process-historic', async (req: Request, res: Response) => {
  try {
    const { fromSlot, toSlot } = req.body;
    
    if (typeof fromSlot !== 'number' || typeof toSlot !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'fromSlot and toSlot must be numbers'
      });
    }

    const listener = await initSolanaListener();
    
    // Clear processed transactions for this debug run to allow reprocessing
    listener.clearProcessedTransactions();
    
    await listener.processHistoricEvents(fromSlot, toSlot);

    res.json({
      success: true,
      message: `Processing historic events from slot ${fromSlot} to ${toSlot} - check server logs for details`
    });

  } catch (error) {
    console.error('Error in process-historic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process historic events',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;