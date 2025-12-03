/**
 * Update specific transaction status to success
 */

import { storage } from "./storage/index.js";

async function updateSpecificTransaction() {
  const txHash = '0x2059aeb41797b59adc1d5c03ea3a0c0bbfe302b5318bc0012117407269e35be1';
  
  console.log(`🔍 Looking for transaction: ${txHash}`);
  
  try {
    await storage.connect();
    console.log('✅ Database connected');
    
    const userId = '689a323267cfc51b8a26c55f';
    
    // 1. Check purchase history first
    console.log('📋 Checking purchase history...');
    const purchaseRecord = await storage.getPurchaseHistoryByTransactionHash(txHash);
    if (purchaseRecord) {
      console.log('✅ Found purchase record:', {
        id: purchaseRecord._id,
        status: purchaseRecord.status,
        metal: purchaseRecord.metal,
        amount: purchaseRecord.tokenAmount
      });
      
      // Update purchase history status
      await storage.updatePurchaseHistory(purchaseRecord._id!, {
        status: 'completed'
      });
      console.log('✅ Purchase history updated to completed');
    }
    
    // 2. Check user transactions
    console.log('📋 Checking user transactions...');
    const userTransactions = await storage.getTransactions(userId);
    const targetTransaction = userTransactions.find(tx => 
      tx.transactionHash === txHash || 
      (tx.status === 'pending' && !tx.transactionHash)
    );
    
    if (targetTransaction) {
      console.log('✅ Found user transaction:', {
        id: targetTransaction._id,
        status: targetTransaction.status,
        type: targetTransaction.type,
        metalType: targetTransaction.metalType,
        amount: targetTransaction.amount,
        currentHash: targetTransaction.transactionHash
      });
      
      // Update transaction status to completed
      const updatedTx = await storage.updateTransaction(targetTransaction._id!, {
        status: 'completed',
        transactionHash: txHash
      });
      
      if (updatedTx) {
        console.log('✅ Transaction updated successfully:', {
          id: updatedTx._id,
          status: 'pending → completed',
          transactionHash: updatedTx.transactionHash
        });
      }
    } else {
      console.log('⚠️ No matching transaction found in user transactions');
    }
    
    // 3. Final verification
    console.log('🔍 Final verification...');
    const verifyTransactions = await storage.getTransactions(userId);
    const completedTx = verifyTransactions.find(tx => 
      tx.transactionHash === txHash && tx.status === 'completed'
    );
    
    if (completedTx) {
      console.log('✅ Verification successful - transaction is now completed:', {
        id: completedTx._id,
        status: completedTx.status,
        transactionHash: completedTx.transactionHash
      });
    } else {
      console.log('❌ Verification failed - transaction not found as completed');
    }
    
    console.log('🎉 Transaction update completed!');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

// Run the update
updateSpecificTransaction().then(() => {
  console.log('🏁 Update completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Update failed:', error);
  process.exit(1);
});