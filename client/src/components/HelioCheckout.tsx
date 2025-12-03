import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { HelioCheckout as HelioWidget, type HelioEmbedConfig } from "@heliofi/checkout-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

type Props = {
  amount: string;
  isOpen: boolean;
  onClose: () => void;
  purchaseId?: string; // Purchase record ID to update
};

export default function HelioCheckout({ amount, isOpen, onClose, purchaseId }: Props) {
  const [ethAmount, setEthAmount] = useState<string>('0.0001');
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(true);

  // Fetch ETH price and convert USD to ETH
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        setIsLoadingPrice(true);
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
        const data = await response.json();
        
        const ethPriceInUsd = data.ethereum.usd;
        
        // Convert USD amount to ETH
        const usdAmount = parseFloat(amount);
        if (!isNaN(usdAmount) && ethPriceInUsd > 0) {
          const calculatedEthAmount = usdAmount / ethPriceInUsd;
          // Round to 6 decimal places for better precision
          const roundedEthAmount = calculatedEthAmount.toFixed(6);
          setEthAmount(roundedEthAmount);
          console.log(`💰 Converting $${usdAmount} USD to ${roundedEthAmount} ETH`);
        }
      } catch (error) {
        console.error('❌ Error fetching ETH price:', error);
        toast({
          title: "Price Fetch Error",
          description: "Failed to fetch current ETH price. Using default amount.",
          variant: "destructive"
        });
        // Keep default amount on error
        setEthAmount('0.0001');
      } finally {
        setIsLoadingPrice(false);
      }
    };

    if (isOpen && amount) {
      fetchEthPrice();
    }
  }, [amount, isOpen]);
  
  const updatePurchaseHistory = async (event: any) => {
    try {
      // if (!purchaseId) {
      //   console.error("No purchase ID provided for transaction update");
      //   toast({
      //     title: "Error",
      //     description: "Unable to update purchase record - no purchase ID",
      //     variant: "destructive"
      //   });
      //   return;
      // }

      console.log("🔄 Updating purchase record with Helio transaction:", {
        purchaseId,
        transactionHash: event.transaction,
        eventData: event
      });

      const response = await fetch(`/api/purchase-history/${purchaseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token || ''}`
        },
        body: JSON.stringify({
          transactionHash: event.transaction,
          status: 'pending' // Update status to pending when payment succeeds
        })
      });

      const result = await response.json();
      console.log("📝 Purchase record update response:", {
        status: response.status,
        ok: response.ok,
        result
      });

      if (response.ok) {
        console.log("✅ Purchase record updated successfully:", result);
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed and recorded.",
        });
        
        // Close the Helio checkout after successful update
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        console.error("❌ Failed to update purchase record:", result);
        toast({
          title: "Update Error",
          description: result.message || "Payment succeeded but failed to update record",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("💥 Error updating purchase history:", error);
      toast({
        title: "Update Error", 
        description: "Failed to update purchase record",
        variant: "destructive"
      });
    }
  };
  const helioConfig: HelioEmbedConfig = {
    paylinkId: "68ba8927345ef03ca41b2b44",
    network: 'test',
    theme: { themeMode: "light" }, // ✅ strictly typed
    primaryColor: "#FE5300",
    neutralColor: "#5A6578",
    amount: ethAmount, // Dynamically calculated ETH amount from USD
    display: "inline",
    onSuccess: (event) => {
      updatePurchaseHistory(event);
      console.log("Helio payment success:", event);
    },
    onError: (event) => console.log("Error:", event),
    onPending: (event) => console.log("Pending:", event),
    onCancel: () => console.log("Cancelled payment"),
    onStartPayment: () => console.log("Starting payment"),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] sm:min-h-[300px]">
        <DialogHeader>
          <DialogDescription className="text-left">
            {isLoadingPrice ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Fetching current ETH price...</p>
                </div>
              </div>
            ) : (
              <>
                {/* <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Amount: <span className="font-semibold text-foreground">${amount} USD</span>
                    {' ≈ '}
                    <span className="font-semibold text-foreground">{ethAmount} ETH</span>
                  </p>
                </div> */}
                <HelioWidget config={helioConfig} />
              </>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
