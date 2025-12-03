# Vaulted Assets API Documentation

## Mint API Endpoints

### 1. Mint Tokens
Mint gold or silver tokens by converting USD to ETH and executing blockchain transaction.

**Endpoint:** `POST /api/mint/tokens`

**Request Body:**
```json
{
  "tokenType": "gold",
  "amountUsd": 100,
  "userWallet": "0xb3ef0999CF39cA4F8c8d800FCc4f979C16E4400F",
  "gasLimit": "300000",
  "gasPrice": "20000000000"
}
```

**Required Fields:**
- `tokenType` (string): Either "gold" or "silver"
- `amountUsd` (number): Amount in USD to convert and mint
- `userWallet` (string): User's wallet address to receive tokens

**Optional Fields:**
- `gasLimit` (string): Gas limit for the transaction
- `gasPrice` (string): Gas price in wei

**Contract Addresses:**
- Gold: `0xE7714e135b33A912C8e6294956230E4Eb01030f4`
- Silver: `0xF486731Ba1E3c9e1D2A53938c9f09633d6625cf8`

**Conversion Rate:** 1 USD = 0.00028 ETH

**Response Success (200):**
```json
{
  "message": "Successfully minted gold tokens",
  "details": {
    "tokenType": "gold",
    "amountUsd": 100,
    "ethAmount": "0.028",
    "weiAmount": "28000000000000000",
    "userWallet": "0xb3ef0999CF39cA4F8c8d800FCc4f979C16E4400F",
    "contractAddress": "0xE7714e135b33A912C8e6294956230E4Eb01030f4",
    "transactionHash": "0xabc123...",
    "gasUsed": "120000",
    "blockNumber": 12345678
  }
}
```

**Response Error (400):**
```json
{
  "message": "Failed to mint gold tokens",
  "error": "Insufficient funds or contract error"
}
```

### 2. Get Conversion Estimate
Get conversion estimate from USD to ETH without executing transaction.

**Endpoint:** `GET /api/mint/estimate?amountUsd=100`

**Query Parameters:**
- `amountUsd` (number): Amount in USD to convert

**Response Success (200):**
```json
{
  "conversion": {
    "usdAmount": 100,
    "ethAmount": "0.028",
    "weiAmount": "28000000000000000",
    "conversionRate": 0.00028
  },
  "contracts": {
    "gold": "0xE7714e135b33A912C8e6294956230E4Eb01030f4",
    "silver": "0xF486731Ba1E3c9e1D2A53938c9f09633d6625cf8"
  }
}
```

## Transaction API Endpoints

### 1. Get Transaction History
Get user's transaction history with pagination and filtering.

**Endpoint:** `GET /api/transactions`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters (all optional):**
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Number of transactions per page (1-100, default: 20)
- `status` (string): Filter by status ('pending', 'completed', 'failed')
- `type` (string): Filter by type ('buy', 'sell')

**Response Success (200):**
```json
{
  "transactions": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "userId": "user-123",
      "type": "buy",
      "metalType": "gold",
      "amount": "0.05",
      "value": "97.50",
      "price": "1950.00",
      "status": "completed",
      "createdAt": "2023-12-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Response Error (401):**
```json
{
  "message": "Access token is required"
}
```

### 2. Get Single Transaction
Get details of a specific transaction by ID.

**Endpoint:** `GET /api/transactions/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Parameters:**
- `id` (string): Transaction ID

**Response Success (200):**
```json
{
  "message": "Transaction retrieved successfully",
  "transaction": {
    "_id": "507f1f77bcf86cd799439011",
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "user-123",
    "type": "buy",
    "metalType": "gold",
    "amount": "0.05",
    "value": "97.50",
    "price": "1950.00",
    "status": "completed",
    "createdAt": "2023-12-15T10:30:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "message": "Transaction not found"
}
```

## Blockchain API Endpoints

### 1. Mint Tokens
Execute the mint function on a blockchain contract.

**Endpoint:** `POST /api/blockchain/mint`

**Request Body:**
```json
{
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "toAddress": "0xAbCdEf1234567890aBcDeF1234567890AbCdEf12", 
  "amount": "1000000000000000000",
  "gasLimit": "300000",
  "gasPrice": "20000000000"
}
```

**Required Fields:**
- `contractAddress` (string): The smart contract address to interact with
- `toAddress` (string): The recipient address for the minted tokens
- `amount` (string): The amount of tokens to mint (in wei or smallest unit)

**Optional Fields:**
- `gasLimit` (string): Gas limit for the transaction
- `gasPrice` (string): Gas price in wei

**Response Success (200):**
```json
{
  "message": "Mint transaction successful",
  "transactionHash": "0xabc123...",
  "gasUsed": "120000",
  "blockNumber": 12345678
}
```

**Response Error (400):**
```json
{
  "message": "Mint transaction failed",
  "error": "Insufficient funds or contract error"
}
```

### 2. Get Transaction Status
Check the status of a blockchain transaction.

**Endpoint:** `GET /api/blockchain/transaction/:txHash`

**Parameters:**
- `txHash` (string): The transaction hash to check

**Response Success (200):**
```json
{
  "status": "success",
  "blockNumber": 12345678,
  "gasUsed": "120000"
}
```

**Response Pending:**
```json
{
  "status": "pending"
}
```

### 3. Get Wallet Balance
Get the ETH balance of the configured wallet.

**Endpoint:** `GET /api/blockchain/wallet/balance`

**Response Success (200):**
```json
{
  "balance": "1000000000000000000",
  "balanceInEther": "1.0",
  "address": "0xb3ef0999CF39cA4F8c8d800FCc4f979C16E4400F"
}
```

### 4. Health Check
Check if the blockchain service is operational.

**Endpoint:** `GET /api/blockchain/health`

**Response Success (200):**
```json
{
  "message": "Blockchain service is operational",
  "walletConnected": true,
  "walletAddress": "0xb3ef0999CF39cA4F8c8d800FCc4f979C16E4400F"
}
```

## Configuration

### Environment Variables
Add these to your environment:

```env
RPC_URL=https://eth-holesky.g.alchemy.com/v2/EdUntStbXZaSHzY-svGENPy8lkmOh5l2
```

**Current Configuration:** Using Holesky testnet with authenticated Alchemy endpoint.

### Wallet Details
- **Address:** 0xb3ef0999CF39cA4F8c8d800FCc4f979C16E4400F
- **Private Key:** (securely stored in service)
- **Mint Function Selector:** 0x40c10f19

### Contract ABI
The service is configured to work with proxy contracts that implement the ERC1967 proxy pattern.

## Security Notes

1. **Private Key Security**: The private key is hardcoded in the service for this implementation. In production, use environment variables or secure key management.

2. **Gas Management**: The service automatically estimates gas if not provided. Monitor gas prices for cost optimization.

3. **Network Configuration**: Currently configured for Ethereum mainnet. Update RPC_URL for different networks.

4. **Error Handling**: All blockchain operations include comprehensive error handling and logging.

## Testing

Use the provided curl examples to test the endpoints:

```bash
# Test mint gold tokens
curl -X POST "http://localhost:5000/api/mint/tokens" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenType": "gold",
    "amountUsd": 100,
    "userWallet": "0xb3ef0999CF39cA4F8c8d800FCc4f979C16E4400F"
  }'

# Test mint silver tokens
curl -X POST "http://localhost:5000/api/mint/tokens" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenType": "silver",
    "amountUsd": 50,
    "userWallet": "0xb3ef0999CF39cA4F8c8d800FCc4f979C16E4400F"
  }'

# Test conversion estimate
curl -X GET "http://localhost:5000/api/mint/estimate?amountUsd=100"

# Test blockchain health
curl -X GET "http://localhost:5000/api/blockchain/health"
```