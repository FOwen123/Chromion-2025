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
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/supabase-client";
import { useAccountStore } from "@/stores/accounts";


interface CreatePaymentModalProps {
  trigger?: React.ReactNode;
  onLinkCreated?: (linkData: {
    title: string;
    description?: string;
    amount: number;
    currency: string;
    chain_id: number;
  }) => void;
}

export function CreatePaymentModal({ trigger, onLinkCreated }: CreatePaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const { account } = useAccountStore();
  const address = account?.address;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    currency: "USDC",
    chainId: "11155111", // Sepolia testnet
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
    // Handle chain selection with availability check
    if (field === "chainId" && value !== "11155111") {
      toast.error("⚠️ Only Sepolia network is currently supported. Other networks are coming soon!");
      return; // Don't update the state, keep it as Sepolia
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    setIsLoading(true);

    try {
      // First, ensure user profile exists (create if not exists)
      const { data: existingUser, error: userError } = await supabase
        .from('user_profiles')
        .select('wallet_address')
        .eq('wallet_address', address)
        .maybeSingle()

      if (!existingUser && !userError) {
        // Create user profile if doesn't exist
        await supabase
          .from('user_profiles')
          .insert({
            wallet_address: address,
            first_login: new Date().toISOString(),
            last_login: new Date().toISOString(),
            login_count: 1,
            is_active: true
          })
      } else if (existingUser) {
        // Update last login if user exists
        await supabase
          .from('user_profiles')
          .update({
            last_login: new Date().toISOString(),
            login_count: (existingUser as any).login_count + 1
          })
          .eq('wallet_address', address)
      }

      let shortId = generateShortId();
      
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
      

      const insertData = {
        short_id: shortId,
        creator_wallet: address,
        title: formData.title,
        description: formData.description || null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        chain_id: parseInt(formData.chainId),
      };
      
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
        currency: "USDC", 
        chainId: "11155111",
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
        {!address && (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded mb-4 text-center">
            Please connect your wallet to create a payment link.
          </div>
        )}
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
                  <SelectItem value="USDC">USDC</SelectItem>
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
                <SelectItem value="11155111">Sepolia</SelectItem>
                <SelectItem value="42161" className="text-muted-foreground">Arbitrum </SelectItem>
                <SelectItem value="42220" className="text-muted-foreground">Celo </SelectItem>
                <SelectItem value="8453" className="text-muted-foreground">Base </SelectItem>
                <SelectItem value="43114" className="text-muted-foreground">Avalanche </SelectItem>
              </SelectContent>
            </Select>
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
      </DialogContent>
    </Dialog>
  );
}