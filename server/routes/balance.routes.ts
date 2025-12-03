import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { createUserToken } from '../utils/canton.utils';
import { ENV } from '@shared/constants';

const router = express.Router();

// Token configurations for Ethereum
const ETHEREUM_TOKEN_CONFIGS = {
  GOLD: {
    contractAddress: process.env.EVM_GOLD_TOKEN_CONTRACT,
    decimals: 18,
  },
  SILVER: {
    contractAddress: process.env.VITE_EVM_SILVER_TOKEN_CONTRACT?.trim(),
    decimals: 18,
  },
};

// Token configurations for Solana
const SOLANA_TOKEN_CONFIGS = {
  GOLD: {
    mintAddress: process.env.SOLANA_GOLD_TOKEN_MINT || '4Abztzso97KPMy6fdexqNeVKqUUn2KF5aw6Vb99rV8qg',
    decimals: 6,
  },
  SILVER: {
    mintAddress: process.env.SOLANA_SILVER_TOKEN_MINT || '3teuujqputEYdvTTLK6eoYygKF2EWDdgFVFGQoce3mc3',
    decimals: 6,
  },
};

// ERC-20 ABI for balance checking
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
];

/**
 * Get Ethereum token balance
 * GET /api/ethereum/token-balance?wallet=0x...&token=GOLD|SILVER
 */
router.get('/ethereum/token-balance', async (req: Request, res: Response) => {
  try {
    const { wallet, token } = req.query;

    if (!wallet || !token) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address and token type are required',
      });
    }

    if (!ethers.isAddress(wallet as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address',
      });
    }

    if (!['GOLD', 'SILVER'].includes(token as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type. Must be GOLD or SILVER',
      });
    }

    const tokenConfig = ETHEREUM_TOKEN_CONFIGS[token as keyof typeof ETHEREUM_TOKEN_CONFIGS];
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth-hoodi.g.alchemy.com/v2/AVi7ZUdETBLSsCTTAMMzU';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const tokenContract = new ethers.Contract(
      tokenConfig.contractAddress,
      ERC20_ABI,
      provider
    );

    const balanceWei = await tokenContract.balanceOf(wallet);
    const balance = ethers.formatUnits(balanceWei, tokenConfig.decimals);
    const balanceNumber = parseFloat(balance);

    res.json({
      success: true,
      balance: balanceNumber,
      balanceFormatted: balance,
      token,
      wallet,
      network: 'Ethereum',
    });
  } catch (error) {
    console.error('Error fetching Ethereum token balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch token balance',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get Solana token balance
 * GET /api/solana/token-balance?wallet=...&token=GOLD|SILVER
 */
router.get('/solana/token-balance', async (req: Request, res: Response) => {
  try {
    const { wallet, token } = req.query;

    if (!wallet || !token) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address and token type are required',
      });
    }

    if (!['GOLD', 'SILVER'].includes(token as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type. Must be GOLD or SILVER',
      });
    }

    try {
      const walletPublicKey = new PublicKey(wallet as string);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid Solana wallet address',
      });
    }

    const tokenConfig = SOLANA_TOKEN_CONFIGS[token as keyof typeof SOLANA_TOKEN_CONFIGS];
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );

    const walletPublicKey = new PublicKey(wallet as string);
    const mintPublicKey = new PublicKey(tokenConfig.mintAddress);

    // Find associated token account
    const accounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
      mint: mintPublicKey,
    });

    let balance = 0;
    if (accounts.value.length > 0) {
      const tokenAccount = accounts.value[0].account.data.parsed.info;
      balance = tokenAccount.tokenAmount.uiAmount || 0;
    }

    res.json({
      success: true,
      balance,
      token,
      wallet,
      network: 'Solana',
    });
  } catch (error) {
    console.error('Error fetching Solana token balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch token balance',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get DAML ledger user balance
 * POST /api/daml/user-balance
 */
router.post('/daml/user-balance', async (req: Request, res: Response) => {
  try {
    const { owner } = req.body;

    if (!owner) {
      return res.status(400).json({
        success: false,
        message: 'Owner parameter is required',
      });
    }

    // DAML ledger configuration
    const damlApiUrl = 'http://37.27.190.172/v1/query';
    const authToken = createUserToken(owner.split("::")[0]); // Use utility function to get or generate token
    const templateId = '323be96aa0b9cd4a6f9cf17a5096b7a69c0cc2da28d31baa5e53c72f2c8ce9c1:TokenExample:Token';

    // Prepare the request payload
    const requestPayload = {
      templateIds: [templateId],
      query: {
        owner: owner
      }
    };

    // Make the API call to DAML ledger
    const response = await axios.post(damlApiUrl, requestPayload, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    // Extract balance data from response
    const contracts = response.data.result || [];
    
    // Calculate total balance from all contracts
    let totalBalance = 0;
    const contractDetails = [];

    for (const contract of contracts) {
      const payload = contract.payload;
      if (payload && payload.amount) {
        const amount = parseFloat(payload.amount) || 0;
        totalBalance += amount;
        contractDetails.push({
          contractId: contract.contractId,
          amount: amount,
          owner: payload.owner,
          issuer: payload.issuer,
          tokenType: payload.tokenType || 'Unknown'
        });
      }
    }

    res.json({
      success: true,
      balance: totalBalance,
      contractCount: contracts.length,
      contracts: contractDetails,
      owner,
      network: 'DAML'
    });

  } catch (error) {
    console.error('Error fetching DAML user balance:', error);
    
    let errorMessage = 'Failed to fetch DAML user balance';
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = `DAML API error: ${error.response.status} - ${error.response.statusText}`;
        statusCode = error.response.status >= 400 && error.response.status < 500 ? 400 : 500;
      } else if (error.request) {
        errorMessage = 'Unable to connect to DAML ledger';
        statusCode = 503;
      }
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;