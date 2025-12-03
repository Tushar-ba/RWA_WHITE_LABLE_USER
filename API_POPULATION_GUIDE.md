# API Population Guide - Using findOne() and populate() Instead of Manual Queries

## Overview
This guide shows how to replace manual database queries with proper Mongoose `findOne()` and `populate()` functions for better performance and cleaner code.

## Problem: Manual Queries (Before)
```javascript
// ❌ Bad: Multiple separate queries
const user = await storage.getUser(userId);           // Query 1
const wallets = await storage.getWallets(userId);     // Query 2
const transactions = await storage.getTransactions(userId); // Query 3

// Result: 3 database round trips
```

## Solution: Using populate() (After)
```javascript
// ✅ Good: Single query with populate
const userWithData = await User
  .findById(userId)
  .populate('wallets')
  .populate('transactions');

// Result: 1 database round trip
```

## Implementation Examples

### 1. User Profile with Wallets
**Before (Manual Queries):**
```javascript
// 2 separate database calls
const user = await storage.getUser(userId);
const wallets = await storage.getWallets(userId);
```

**After (Using populate):**
```javascript
// 1 database call with population
const result = await storage.getUserWithWallets(userId);
// Returns: { user, wallets }
```

### 2. Gifting Records with User Info
**Before:**
```javascript
const giftings = await Gifting.find({ userId });
// Manual lookup needed for user details
```

**After:**
```javascript
const giftings = await Gifting
  .find({ userId })
  .populate('userId', 'email first_name last_name country state')
  .sort({ createdAt: -1 });
```

### 3. Transaction History with User Data
**Before:**
```javascript
const transactions = await Transaction.find({ userId });
const user = await User.findById(userId); // Extra query
```

**After:**
```javascript
const transactions = await Transaction
  .find({ userId })
  .populate('userId', 'email first_name last_name')
  .sort({ createdAt: -1 });
```

## Available Enhanced API Endpoints

### 1. Enhanced User Profile
- **Endpoint**: `GET /api/users-enhanced/profile-enhanced`
- **Method**: Uses `getUserWithWallets()` with populate
- **Benefit**: Single query instead of 2 separate queries

### 2. Enhanced Gifting
- **Endpoint**: `GET /api/gifting-enhanced/`
- **Method**: Uses `populate('userId', 'email first_name last_name')`
- **Benefit**: Gets gifting records with user info in one query

### 3. Direct Populate Example
- **Endpoint**: `GET /api/gifting-enhanced/example-populate`
- **Method**: Direct Mongoose populate demonstration
- **Shows**: How to structure ideal API calls

## Key Mongoose populate() Features

### Basic populate
```javascript
.populate('userId')  // Populates entire referenced document
```

### Field selection
```javascript
.populate('userId', 'email first_name last_name')  // Only specific fields
```

### Sorting with populate
```javascript
.populate('userId', 'email first_name')
.sort({ createdAt: -1 })  // Sort results
```

### Multiple populates
```javascript
.populate('userId', 'email first_name')
.populate('walletId', 'address type')
```

## Storage Layer Implementation

### Interface Method
```typescript
// Added to IStorage interface
getUserWithWallets?(userId: string): Promise<{ user: User, wallets: Wallet[] } | null>;
```

### Mongoose Implementation
```typescript
async getUserWithWallets(userId: string) {
  const user = await User.findById(userId);
  const wallets = await Wallet
    .find({ userId })
    .populate('userId', 'email first_name last_name');
  
  return { user, wallets };
}
```

## Environment Configuration

To enable the new populate methods:
```bash
USE_MONGOOSE=true  # Enables Mongoose storage with populate functionality
```

## Performance Benefits

| Method | Database Calls | Network Round Trips | Performance |
|--------|---------------|-------------------|-------------|
| Manual Queries | Multiple (2-5) | High | Slower |
| populate() | Single | Low | Faster |

## Testing the Implementation

1. **Set Environment Variable:**
   ```bash
   USE_MONGOOSE=true
   ```

2. **Test Enhanced User Profile:**
   ```bash
   GET /api/users-enhanced/profile-enhanced
   ```

3. **Compare Methods:**
   - Response includes `method_used` field showing which approach was used
   - `query_count` shows number of database calls made

## Files Modified

- `server/storage/mongoose.storage.ts` - Added populate methods
- `server/routes/user-enhanced.routes.ts` - Enhanced user API
- `server/routes/gifting-enhanced.ts` - Enhanced gifting API  
- `server/storage/populate-examples.ts` - Usage examples
- `server/storage/IStorage.ts` - Added optional populate methods

## Next Steps

1. Update all existing APIs to use populate methods
2. Add virtual fields to schemas for reverse population
3. Implement populate for all collection relationships
4. Measure and compare performance improvements