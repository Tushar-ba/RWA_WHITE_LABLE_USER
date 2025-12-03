import { ethers } from 'ethers';

export class BlockchainService {
  private static readonly WALLET_ADDRESS = process.env.WALLET_ADDRESS!;
  private static readonly PRIVATE_KEY = process.env.PRIVATE_KEY!;
  private static readonly MINT_FUNCTION_SELECTOR = process.env.MINT_FUNCTION_SELECTOR!;
  
  // Contract ABI for the proxy contract
  private static readonly CONTRACT_ABI = [
    {
      "inputs": [
        {"internalType": "address", "name": "implementation", "type": "address"},
        {"internalType": "bytes", "name": "_data", "type": "bytes"}
      ],
      "stateMutability": "payable",
      "type": "constructor"
    },
    {
      "inputs": [{"internalType": "address", "name": "target", "type": "address"}],
      "name": "AddressEmptyCode",
      "type": "error"
    },
    {
      "inputs": [{"internalType": "address", "name": "implementation", "type": "address"}],
      "name": "ERC1967InvalidImplementation",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ERC1967NonPayable",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "FailedCall",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "address", "name": "implementation", "type": "address"}
      ],
      "name": "Upgraded",
      "type": "event"
    },
    {
      "stateMutability": "payable",
      "type": "fallback"
    }
  ];

  /**
   * Get provider instance
   */
  private static getProvider(): ethers.JsonRpcProvider {
    // Using Holesky testnet RPC endpoint
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth-holesky.g.alchemy.com/v2/EdUntStbXZaSHzY-svGENPy8lkmOh5l2';
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Get wallet instance
   */
  private static getWallet(): ethers.Wallet {
    const provider = this.getProvider();
    return new ethers.Wallet(this.PRIVATE_KEY, provider);
  }

  /**
   * Get contract instance
   */
  private static getContract(contractAddress: string): ethers.Contract {
    const wallet = this.getWallet();
    return new ethers.Contract(contractAddress, this.CONTRACT_ABI, wallet);
  }

  /**
   * Execute mint function on the blockchain with default gas settings
   * @param contractAddress - The contract address to interact with
   * @param toAddress - Address to mint tokens to
   * @param amount - Amount of tokens to mint (in wei or smallest unit)
   */
  static async mint(
    contractAddress: string,
    toAddress: string,
    amount: string
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
    gasUsed?: string;
    blockNumber?: number;
  }> {
    try {
      console.log(`🔗 Initiating mint transaction...`);
      console.log(`📍 Contract: ${contractAddress}`);
      console.log(`👤 To Address: ${toAddress}`);
      console.log(`💰 Amount: ${amount}`);

      // Validate addresses
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Invalid contract address');
      }
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Invalid recipient address');
      }

      const wallet = this.getWallet();
      
      // Check wallet balance
      const provider = wallet.provider;
      if (!provider) {
        throw new Error('Wallet provider not available');
      }
      const balance = await provider.getBalance(wallet.address);
      console.log(`💳 Wallet Balance: ${ethers.formatEther(balance)} ETH`);

      // Encode mint function call data
      const abiCoder = new ethers.AbiCoder();
      const mintCallData = ethers.concat([
        this.MINT_FUNCTION_SELECTOR,
        abiCoder.encode(['address', 'uint256'], [toAddress, amount])
      ]);

      // Prepare transaction
      const txData: any = {
        to: contractAddress,
        data: mintCallData,
        value: 0 // Mint function typically doesn't require ETH
      };

      // Use default gas values - no longer accepting custom gas parameters
      // Set default gas limit
      try {
        const estimatedGas = await wallet.estimateGas(txData);
        // Add 20% buffer to estimated gas
        const gasWithBuffer = (estimatedGas * BigInt(120)) / BigInt(100);
        txData.gasLimit = gasWithBuffer;
        console.log(`⛽ Estimated Gas: ${estimatedGas.toString()}`);
        console.log(`⛽ Gas with Buffer: ${gasWithBuffer.toString()}`);
      } catch (error) {
        console.warn('⚠️ Gas estimation failed, using default gas limit');
        txData.gasLimit = '300000'; // Default gas limit
      }

      // Use default gas price (let network determine)
      // No manual gas price setting - use network defaults

      // Send transaction
      console.log(`📤 Sending transaction...`);
      const tx = await wallet.sendTransaction(txData);
      console.log(`🚀 Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      console.log(`⏳ Waiting for confirmation...`);
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
        
        return {
          success: true,
          transactionHash: receipt.hash,
          gasUsed: receipt.gasUsed.toString(),
          blockNumber: receipt.blockNumber
        };
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error('❌ Mint transaction failed:', error);
      
      let errorMessage = 'Unknown blockchain error';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.reason) {
        errorMessage = error.reason;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get transaction status
   */
  static async getTransactionStatus(txHash: string): Promise<{
    success: boolean;
    status?: string;
    blockNumber?: number;
    gasUsed?: string;
    error?: string;
  }> {
    try {
      const provider = this.getProvider();
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return {
          success: false,
          status: 'pending'
        };
      }

      return {
        success: true,
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get transaction status'
      };
    }
  }

  /**
   * Get wallet balance
   */
  static async getWalletBalance(): Promise<{
    success: boolean;
    balance?: string;
    balanceInEther?: string;
    error?: string;
  }> {
    try {
      const wallet = this.getWallet();
      const provider = wallet.provider;
      if (!provider) {
        throw new Error('Wallet provider not available');
      }
      const balance = await provider.getBalance(wallet.address);
      
      return {
        success: true,
        balance: balance.toString(),
        balanceInEther: ethers.formatEther(balance)
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get wallet balance'
      };
    }
  }
}