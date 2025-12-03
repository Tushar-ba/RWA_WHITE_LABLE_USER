import { storage } from './storage/index.js';

async function updateExistingBlockchainRecords() {
  console.log('🔄 Updating existing blockchain-created gifting records...\n');
  
  try {
    // Connect to database
    await storage.connect();
    
    // Get all giftings with blockchain-event user ID
    const blockchainGiftings = await storage.getGiftingsByUser('blockchain-event');
    console.log(`Found ${blockchainGiftings.length} blockchain-event records to update\n`);
    
    for (const gifting of blockchainGiftings) {
      console.log(`Processing record ${gifting.id}:`);
      console.log(`  Transaction: ${gifting.transactionHash}`);
      console.log(`  Current User ID: ${gifting.userId}`);
      
      // Find the sender's wallet address - we need to extract from transaction data
      // For now, let's check if we have the from address in the transaction
      // We'll look this up from the blockchain or extract from stored data
      
      // For the specific transactions we know about:
      const knownTransactions = {
        '0xb08785adf8e3b3f44b577735100b58299cea51f6482f0df090625b2ee49ec5cd': '0xb3ef0999CF39cA4F8c8d800FCc4f979C16E4400F',
        '0xeee3936cb48f2ee16640475d45397ac95c0d3dd3296f14a10ce79f5772992000': '0xb3ef0999CF39cA4F8c8d800FCc4f979C16E4400F'
      };
      
      const fromAddress = knownTransactions[gifting.transactionHash];
      if (fromAddress) {
        console.log(`  From Address: ${fromAddress}`);
        
        // Lookup user ID from wallet address
        const actualUserId = await storage.getUserIdByWalletAddress(fromAddress);
        
        if (actualUserId) {
          console.log(`  ✅ Found user ID: ${actualUserId}`);
          
          // Update the gifting record
          await storage.updateGifting(gifting.id, { userId: actualUserId });
          console.log(`  ✅ Updated record with actual user ID\n`);
        } else {
          console.log(`  ❌ No user found for wallet address ${fromAddress}`);
          console.log(`  📝 Keeping placeholder user ID\n`);
        }
      } else {
        console.log(`  ❌ Unknown transaction hash, cannot determine sender address\n`);
      }
    }
    
    console.log('✅ Finished updating existing records');
    
  } catch (error) {
    console.error('❌ Error updating records:', error);
  }
  
  process.exit(0);
}

updateExistingBlockchainRecords();