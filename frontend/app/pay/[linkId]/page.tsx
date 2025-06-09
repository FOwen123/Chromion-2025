"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConnectEmbed, useActiveAccount } from "thirdweb/react";
import { client } from "@/lib/client";
import { supabase } from "@/lib/supabase/supabase-client";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { prepareContractCall, sendTransaction, getContract, prepareTransaction } from "thirdweb";
import { defineChain } from "thirdweb/chains";

interface PaymentLink {
  id: string;
  short_id: string;
  creator_wallet: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  chain_id: number;
  status: string;
  expires_at: string;
  max_uses: number;
  current_uses: number;
  total_collected: number;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isAuthenticated } = useAuth();
  const account = useActiveAccount();
  
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkId = params.linkId as string;

  useEffect(() => {
    fetchPaymentLink();
  }, [linkId]);

  const fetchPaymentLink = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('short_id', linkId)
        .eq('status', 'active')
        .single();

      if (error) throw error;

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("This payment link has expired");
        return;
      }

      // Check if max uses reached
      if (data.max_uses && data.current_uses >= data.max_uses) {
        setError("This payment link has reached its maximum number of uses");
        return;
      }

      setPaymentLink(data);
    } catch (error) {
      console.error("Error fetching payment link:", error);
      setError("Payment link not found or is no longer active");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!account || !paymentLink) return;

    setIsPaying(true);
    try {
      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          payment_link_id: paymentLink.id,
          payer_wallet: address,
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          chain_id: paymentLink.chain_id,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Prepare the transaction based on currency
      let transaction;
      const chain = defineChain(paymentLink.chain_id);
      
              if (paymentLink.currency === 'ETH') {
          // Native ETH transfer
          transaction = prepareTransaction({
            to: paymentLink.creator_wallet,
            value: BigInt(Math.floor(paymentLink.amount * 1e18)), // Convert to Wei
            chain,
            client,
          });
        } else {
          // For now, just ETH payments (can add ERC-20 later)
          transaction = prepareTransaction({
            to: paymentLink.creator_wallet,
            value: BigInt(Math.floor(paymentLink.amount * 1e18)),
            chain,
            client,
          });
        }

      // Send the transaction
      const result = await sendTransaction({
        account,
        transaction,
      });

      // Update payment record with transaction hash
      await supabase
        .from('payments')
        .update({
          tx_hash: result.transactionHash,
          status: 'completed',
          paid_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      // Update payment link usage count
      await supabase
        .from('payment_links')
        .update({
          current_uses: paymentLink.current_uses + 1,
          total_collected: paymentLink.amount + (paymentLink.total_collected || 0)
        })
        .eq('id', paymentLink.id);

      toast.success("Payment completed successfully!");
      router.push('/dashboard');
      
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Payment Link Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payment Details - Left Side */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{paymentLink?.title}</CardTitle>
            {paymentLink?.description && (
              <CardDescription>{paymentLink.description}</CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {paymentLink?.amount} {paymentLink?.currency}
              </div>
              <div className="text-sm text-muted-foreground">
                Payment Amount
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Recipient:</span>
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {paymentLink?.creator_wallet.slice(0, 6)}...{paymentLink?.creator_wallet.slice(-4)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="font-medium">Network:</span>
                <Badge variant="secondary">
                  {paymentLink?.chain_id === 1 ? 'Ethereum' : 
                   paymentLink?.chain_id === 137 ? 'Polygon' :
                   paymentLink?.chain_id === 56 ? 'BSC' : 'Other'}
                </Badge>
              </div>

              <div className="flex justify-between text-sm">
                <span className="font-medium">Currency:</span>
                <span>{paymentLink?.currency}</span>
              </div>

              {paymentLink?.expires_at && (
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Expires:</span>
                  <span>{new Date(paymentLink.expires_at).toLocaleDateString()}</span>
                </div>
              )}

              {paymentLink?.max_uses && (
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Uses:</span>
                  <span>{paymentLink.current_uses} / {paymentLink.max_uses}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wallet Connection & Payment - Right Side */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              {!isAuthenticated ? "Connect Your Wallet" : "Complete Payment"}
            </CardTitle>
            <CardDescription>
              {!isAuthenticated 
                ? "Connect your wallet to complete this payment" 
                : "Review and confirm your payment"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!isAuthenticated ? (
              <div className="text-center">
                <ConnectEmbed client={client} theme="dark" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Connected Wallet</div>
                  <div className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold">
                      {paymentLink?.amount} {paymentLink?.currency}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total to pay
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {isAuthenticated && (
            <CardFooter>
              <Button 
                onClick={handlePayment}
                disabled={isPaying}
                className="w-full"
                size="lg"
              >
                {isPaying ? "Processing Payment..." : `Pay ${paymentLink?.amount} ${paymentLink?.currency}`}
              </Button>
            </CardFooter>
          )}
        </Card>
        
      </div>
    </div>
  );
} 