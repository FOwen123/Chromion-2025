"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusIcon, Copy, Check } from "lucide-react";
import { ConnectEmbed } from "thirdweb/react";
import { client } from "@/lib/client";
import { supabase } from "@/lib/supabase/supabase-client";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

interface CreatePaymentLinkModalProps {
  trigger?: React.ReactNode;
  onLinkCreated?: (linkData: any) => void;
}

export function CreatePaymentLinkModal({ trigger, onLinkCreated }: CreatePaymentLinkModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const { address, account, isAuthenticated, userProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    currency: "ETH",
    chainId: "1", // Ethereum mainnet
    expiresIn: "", // hours
    maxUses: "",
  });

  const generateShortId = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Form submitted!", { formData, address });
    
    if (!address) {
      toast.error("Please connect your wallet first");
      console.error("❌ No wallet address found");
      return;
    }

    setIsLoading(true);
    console.log("📝 Starting payment link creation...");

    try {
      let shortId = generateShortId();
      console.log("🎲 Generated short ID:", shortId);
      
      // Ensure unique short ID
      let attempts = 0;
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from('payment_links')
          .select('short_id')
          .eq('short_id', shortId)
          .single();
        
        if (!existing) break;
        shortId = generateShortId();
        attempts++;
        console.log(`🔄 Collision detected, trying new ID: ${shortId}`);
      }

      const expiresAt = formData.expiresIn 
        ? new Date(Date.now() + parseInt(formData.expiresIn) * 60 * 60 * 1000).toISOString()
        : null;

      const insertData = {
        short_id: shortId,
        creator_wallet: address,
        title: formData.title,
        description: formData.description || null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        chain_id: parseInt(formData.chainId),
        expires_at: expiresAt,
        max_uses: formData.maxUses ? parseInt(formData.maxUses) : null,
      };

      console.log("💾 Inserting data:", insertData);

      const { data, error } = await supabase
        .from('payment_links')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("❌ Database error:", error);
        throw error;
      }

      console.log("✅ Payment link created:", data);

      const paymentUrl = `${window.location.origin}/pay/${shortId}`;
      setCreatedLink(paymentUrl);
      
      toast.success("🎉 Payment link created successfully!");
      onLinkCreated?.(data);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        amount: "",
        currency: "ETH", 
        chainId: "1",
        expiresIn: "",
        maxUses: "",
      });
      
    } catch (error) {
      console.error("💥 Error creating payment link:", error);
      toast.error(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      console.log("🏁 Form submission completed");
    }
  };

  const copyToClipboard = async () => {
    if (createdLink) {
      await navigator.clipboard.writeText(createdLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isFormValid = formData.title && formData.amount;

  if (createdLink) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <PlusIcon className="w-4 h-4" />
              Create Payment Link
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment Link Created! 🎉</DialogTitle>
            <DialogDescription>
              Your payment link is ready to share. Anyone with this link can pay you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Payment Link</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input value={createdLink} readOnly className="text-sm" />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setCreatedLink(null);
                setOpen(false);
              }}
              className="w-full"
            >
              Create Another Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <PlusIcon className="w-4 h-4" />
            Create Payment Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Payment Link</DialogTitle>
          <DialogDescription>
            Create a cross-chain payment link that others can use to send you payments.
          </DialogDescription>
        </DialogHeader>
        
        {!isAuthenticated ? (
          <div className="text-center py-6">
            <h3 className="text-lg font-semibold mb-4">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-6">
              You need to connect your wallet to create payment links.
            </p>
            <ConnectEmbed 
              client={client}
              theme="dark"
            />
          </div>
        ) : (
          // Show form only when wallet is connected
          <>


        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Payment Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Coffee Payment, Service Fee"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for this payment link"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.000001"
                placeholder="0.1"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chainId">Blockchain Network</Label>
            <Select value={formData.chainId} onValueChange={(value) => handleInputChange("chainId", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Ethereum</SelectItem>
                <SelectItem value="137">Polygon</SelectItem>
                <SelectItem value="56">BSC</SelectItem>
                <SelectItem value="43114">Avalanche</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiresIn">Expires In (hours)</Label>
              <Input
                id="expiresIn"
                type="number"
                placeholder="24"
                value={formData.expiresIn}
                onChange={(e) => handleInputChange("expiresIn", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxUses">Max Uses</Label>
              <Input
                id="maxUses"
                type="number"
                placeholder="Unlimited"
                value={formData.maxUses}
                onChange={(e) => handleInputChange("maxUses", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? "Creating..." : "Create Payment Link"}
            </Button>
          </DialogFooter>
        </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}