# Unified Token Transfer Hook Documentation

## Overview

The `useTokenTransfer` hook is a unified solution for handling blockchain token transfers for both Gold Reserve Tokens (GRT) and Silver Reserve Tokens (SRT). This hook replaces the previous separate `useGoldTransfer` and `useSilverTransfer` hooks to reduce code duplication and provide a consistent interface.

## Features

- **Dynamic Token Selection**: Automatically selects the correct contract address and ABI based on token type
- **Unified Interface**: Single hook for both gold and silver token transfers
- **Type Safety**: Fully typed with TypeScript support
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Transaction Status**: Real-time transfer status tracking
- **Toast Notifications**: Built-in success and error notifications

## Usage

### Basic Implementation

```typescript
import { useTokenTransfer, type TokenType } from '@/hooks/useTokenTransfer';

export default function TransferComponent() {
  const [tokenType, setTokenType] = useState<TokenType>('GOLD');
  
  const {
    transfer,
    isTransferring,
    isConfirming,
    isConfirmed,
    transactionHash,
    error,
    tokenConfig
  } = useTokenTransfer(tokenType);

  const handleTransfer = async () => {
    try {
      await transfer({
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        amount: '1.5',
        decimals: 18
      });
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  return (
    <div>
      <select value={tokenType} onChange={(e) => setTokenType(e.target.value as TokenType)}>
        <option value="GOLD">Gold</option>
        <option value="SILVER">Silver</option>
      </select>
      
      <button 
        onClick={handleTransfer} 
        disabled={isTransferring}
      >
        {isTransferring ? 'Transferring...' : `Transfer ${tokenConfig.symbol}`}
      </button>
      
      {isConfirmed && transactionHash && (
        <p>Transfer confirmed! TX: {transactionHash}</p>
      )}
    </div>
  );
}
```

### Dynamic Token Type

When the token type changes, the hook automatically reconfigures to use the appropriate contract:

```typescript
const [form, setForm] = useState({
  token: 'GOLD' as TokenType,
  // ... other form fields
});

// Hook automatically updates when form.token changes
const tokenTransfer = useTokenTransfer(form.token);
```

## Hook Parameters

### `tokenType: TokenType`
The type of token to transfer. Must be either `'GOLD'` or `'SILVER'`.

## Hook Returns

### `transfer(params: TransferParams)`
Initiates a token transfer with the given parameters.

**Parameters:**
- `to: string` - Recipient wallet address (must be a valid Ethereum address)
- `amount: string` - Amount to transfer (supports decimal values)
- `decimals?: number` - Token decimals (default: 18)

### `isTransferring: boolean`
Indicates if a transfer is currently being processed (includes both pending and confirming states).

### `isConfirming: boolean`
Indicates if the transaction is being confirmed on the blockchain.

### `isConfirmed: boolean`
Indicates if the transaction has been confirmed.

### `transactionHash: string | undefined`
The hash of the transaction (available after initiation).

### `error: Error | null`
Any error that occurred during the transfer process.

### `tokenConfig: TokenConfig`
Configuration object for the current token containing:
- `contractAddress: string` - Smart contract address
- `abi: any[]` - Contract ABI
- `name: string` - Full token name
- `symbol: string` - Token symbol

## Token Configurations

The hook uses predefined configurations for each token type:

```typescript
const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  GOLD: {
    contractAddress: import.meta.env.VITE_GOLD_TOKEN_CONTRACT,
    abi: grtABI,
    name: 'Gold Reserve Token',
    symbol: 'GRT'
  },
  SILVER: {
    contractAddress: import.meta.env.VITE_SILVER_TOKEN_CONTRACT,
    abi: srtAbi,
    name: 'Silver Reserve Token', 
    symbol: 'SRT'
  }
};
```

## Environment Variables

The hook requires the following environment variables:

- `VITE_GOLD_TOKEN_CONTRACT` - Gold token contract address
- `VITE_SILVER_TOKEN_CONTRACT` - Silver token contract address

## Error Handling

The hook provides comprehensive error handling:

- **User Rejection**: When user rejects the transaction
- **Insufficient Funds**: When user doesn't have enough tokens
- **Invalid Address**: When recipient address is malformed
- **Contract Errors**: When smart contract calls fail
- **Network Errors**: When blockchain connection fails

## Integration Example

Here's how it's integrated in the gifting transfer page:

```typescript
export default function GiftingTransfer() {
  const [form, setForm] = useState({
    token: 'GOLD' as TokenType,
    wallet: '',
    quantity: '',
    // ... other fields
  });

  const {
    transfer: tokenTransferFn,
    isTransferring: isTokenTransferLoading,
    isConfirmed: isTokenConfirmed,
    transactionHash: tokenHash,
    error: tokenTransferError
  } = useTokenTransfer(form.token);

  const handleSubmit = async () => {
    try {
      await tokenTransferFn({
        to: form.wallet,
        amount: form.quantity,
        decimals: 18
      });
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  };

  return (
    // UI components using the hook state
  );
}
```

## Benefits

1. **Reduced Code Duplication**: Single hook instead of separate gold/silver hooks
2. **Maintainability**: Changes only need to be made in one place
3. **Consistency**: Uniform behavior across both token types
4. **Flexibility**: Easy to add new token types by extending the configuration
5. **Type Safety**: Full TypeScript support with proper type definitions

## Migration from Separate Hooks

If migrating from the old separate hooks:

### Before:
```typescript
const silverTransfer = useSilverTransfer();
const goldTransfer = useGoldTransfer();

// Conditional logic needed
if (tokenType === 'SILVER') {
  await silverTransfer.transfer({ to, amount });
} else {
  await goldTransfer.transfer({ to, amount });
}
```

### After:
```typescript
const tokenTransfer = useTokenTransfer(tokenType);

// Single call works for both
await tokenTransfer.transfer({ to, amount });
```

## Technical Implementation

The hook uses:
- **wagmi**: For Ethereum wallet interactions
- **ethers.js**: For blockchain utilities (parseUnits)
- **React hooks**: For state management and side effects
- **Toast notifications**: For user feedback

The implementation automatically handles:
- Contract address resolution
- ABI selection
- Wei conversion
- Transaction status tracking
- Error message formatting