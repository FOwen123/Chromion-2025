import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccountStore } from "@/stores/accounts";
import { supabase } from "@/lib/supabase/supabase-client";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const fetchPaymentLinks = async (creator_wallet: string) => {
  const { data, error } = await supabase
    .from("payment_links")
    .select("*")
    .eq("creator_wallet", creator_wallet)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

const deletePaymentLink = async (linkId: string) => {
  const { error } = await supabase
    .from("payment_links")
    .delete()
    .eq("id", linkId);
  if (error) throw error;
  return true;
};

function PaymentLinksSkeleton() {
  return (
    <div>
      <div className="h-7 w-48 bg-zinc-800 rounded animate-pulse mb-2" />
      <ul className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <li key={i} className="p-2 border rounded">
            <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-zinc-800 rounded animate-pulse" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UserPaymentLinks() {
  const { account } = useAccountStore();
  const address = account?.address;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["payment-links", address],
    queryFn: () => fetchPaymentLinks(address!),
    enabled: !!address,
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-links", address] });
      toast.success("Payment link deleted successfully!");
    },
    onError: (error) => {
      console.error("Delete failed:", error);
      toast.error("Failed to delete payment link. Please try again.");
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard!");
  };

  if (!address) return <div>Please connect your wallet.</div>;
  if (isLoading) return <PaymentLinksSkeleton />;
  if (error) return <div>Error loading payment links.</div>;
  if (!data || data.length === 0) return <div>No payment links found.</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Your Payment Links</h2>
      <ul className="space-y-3">
        {data.map((link: any) => (
          <li key={link.id} className="p-4 border rounded-lg bg-card">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-lg">{link.title}</div>
                <div className="text-sm text-muted-foreground mb-2">{link.description}</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{link.amount} {link.currency}</span>
                  <Badge variant={link.status === 'active' ? 'default' : 'secondary'}>
                    {link.status}
                  </Badge>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`${window.location.origin}/pay/${link.short_id}`)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <a
                    href={`/pay/${link.short_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Payment Link</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{link.title}"? This action cannot be undone.
                        Anyone with this link will no longer be able to make payments.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(link.id)}
                        disabled={deleteMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-muted rounded text-xs font-mono break-all">
              {window.location.origin}/pay/{link.short_id}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 