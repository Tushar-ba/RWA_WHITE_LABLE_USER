# useTokenBalance Hook Documentation

## Overview
The `useTokenBalance` hook provides a unified interface for querying token balances for both Gold Reserve Token (GRT) and Silver Reserve Token (SRT) contracts. It follows the same clean pattern as `useTokenTransfer` and `useTokenRedemption` hooks.

## Features
- **Unified Interface**: Single hook handles both GOLD and SILVER token balance queries
- **Object-based Configuration**: Dynamic contract selection using TokenType parameter
- **Automatic Formatting**: Converts Wei values to human-readable decimal format
- **Error Handling**: Built-in error management with user feedback via toast notifications
- **Validation**: Address validation and contract existence checking
- **TypeScript Support**: Full type safety with proper return types

## Usage

### Basic Usage
```typescript
import { useTokenBalance } from '@/hooks/useTokenBalance';

const MyComponent = () => {
  const userAddress = '0x1234567890abcdef1234567890abcdef12345678';
  
  // Query GOLD token balance
  const {
    balance: goldBalance,
    balanceNumber: goldBalanceNumber,
    isLoading: isGoldLoading,
    error: goldError,
    refetch: refetchGoldBalance
  } = useTokenBalance('GOLD', { account: userAddress });

  // Query SILVER token balance
  const {
    balance: silverBalance,
    balanceNumber: silverBalanceNumber,
    isLoading: isSilverLoading,
    error: silverError,
    refetch: refetchSilverBalance
  } = useTokenBalance('SILVER', { account: userAddress });

  return (
    <div>
      <p>Gold Balance: {goldBalance} GRT</p>
      <p>Silver Balance: {silverBalance} SRT</p>
      {isGoldLoading && <p>Loading gold balance...</p>}
      {isSilverLoading && <p>Loading silver balance...</p>}
    </div>
  );
};
```

### With Custom Decimals
```typescript
const { balance, balanceNumber } = useTokenBalance('GOLD', {
  account: userAddress,
  decimals: 6 // Use 6 decimals instead of default 18
});
```

### Manual Refresh
```typescript
const { refetch } = useTokenBalance('GOLD', { account: userAddress });

const handleRefresh = async () => {
  try {
    await refetch();
    console.log('Balance refreshed successfully');
  } catch (error) {
    console.error('Failed to refresh balance:', error);
  }
};
```

## API Reference

### Parameters
```typescript
useTokenBalance(tokenType: TokenType, params: BalanceParams)
```

#### tokenType: TokenType
- `'GOLD'` - Query Gold Reserve Token balance
- `'SILVER'` - Query Silver Reserve Token balance

#### params: BalanceParams
```typescript
interface BalanceParams {
  account: string;    // Wallet address to query balance for
  decimals?: number;  // Token decimals (default: 18)
}
```

### Return Value
```typescript
{
  balance: string;           // Formatted balance (e.g., "1.5")
  balanceNumber: number;     // Balance as number for calculations
  balanceRaw: bigint;        // Raw balance in Wei
  isLoading: boolean;        // Loading state
  error: Error | null;       // Error state
  refetch: () => Promise<any>; // Manual refresh function
  tokenConfig: TokenConfig;  // Token configuration details
}
```

## Configuration

The hook uses object-based configuration for each token type:

```typescript
const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  GOLD: {
    contractAddress: import.meta.env.VITE_GOLD_TOKEN_CONTRACT?.trim() || '',
    abi: grtABI,
    name: 'Gold Reserve Token',
    symbol: 'GRT',
  },
  SILVER: {
    contractAddress: import.meta.env.VITE_SILVER_TOKEN_CONTRACT?.trim() || '',
    abi: srtAbi,
    name: 'Silver Reserve Token',
    symbol: 'SRT',
  },
};
```

## Environment Variables

Required environment variables:
- `VITE_GOLD_TOKEN_CONTRACT` - Gold token contract address
- `VITE_SILVER_TOKEN_CONTRACT` - Silver token contract address

## Error Handling

The hook provides comprehensive error handling:

1. **Contract Address Validation**: Ensures contract addresses are configured
2. **Account Address Validation**: Validates wallet address format
3. **Network Errors**: Handles blockchain connection issues
4. **User Feedback**: Shows error messages via toast notifications

## Examples

### Portfolio Balance Display
```typescript
const PortfolioBalances = ({ userAddress }: { userAddress: string }) => {
  const goldBalance = useTokenBalance('GOLD', { account: userAddress });
  const silverBalance = useTokenBalance('SILVER', { account: userAddress });

  const totalValue = useMemo(() => {
    const goldValue = goldBalance.balanceNumber * GOLD_PRICE_USD;
    const silverValue = silverBalance.balanceNumber * SILVER_PRICE_USD;
    return goldValue + silverValue;
  }, [goldBalance.balanceNumber, silverBalance.balanceNumber]);

  return (
    <div className="space-y-4">
      <div>
        <h3>Token Balances</h3>
        <p>Gold: {goldBalance.balance} GRT</p>
        <p>Silver: {silverBalance.balance} SRT</p>
        <p>Total Value: ${totalValue.toFixed(2)} USD</p>
      </div>
      
      {(goldBalance.isLoading || silverBalance.isLoading) && (
        <div>Loading balances...</div>
      )}
    </div>
  );
};
```

### Balance Refresh Component
```typescript
const BalanceRefresher = ({ userAddress }: { userAddress: string }) => {
  const goldBalance = useTokenBalance('GOLD', { account: userAddress });
  const silverBalance = useTokenBalance('SILVER', { account: userAddress });

  const handleRefreshAll = async () => {
    await Promise.all([
      goldBalance.refetch(),
      silverBalance.refetch()
    ]);
  };

  return (
    <button 
      onClick={handleRefreshAll}
      disabled={goldBalance.isLoading || silverBalance.isLoading}
    >
      {goldBalance.isLoading || silverBalance.isLoading ? 'Refreshing...' : 'Refresh Balances'}
    </button>
  );
};
```

## Technical Details

### Wagmi Integration
- Uses `useReadContract` from wagmi for blockchain interaction
- Implements proper query configuration with enabled conditions
- Handles contract ABI and address resolution automatically

### Data Formatting
- Converts raw Wei values using ethers.js `formatUnits`
- Provides both string and number formats for different use cases
- Maintains raw bigint value for precise calculations

### Query Optimization
- Only executes queries when valid addresses and contracts are provided
- Automatic re-fetching when dependencies change
- Manual refresh capability for real-time updates

## Benefits

1. **Code Reuse**: Single hook for both token types eliminates duplication
2. **Type Safety**: Full TypeScript support with proper type inference
3. **Error Resilience**: Comprehensive error handling and user feedback
4. **Performance**: Optimized queries with conditional execution
5. **Developer Experience**: Clean API with consistent patterns across all token hooks
6. **Maintainability**: Centralized configuration and logic