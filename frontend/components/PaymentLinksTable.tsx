"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Copy, 
  MoreHorizontal, 
  Trash2, 
  ExternalLink, 
  PauseCircle,
  PlayCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase/supabase-client";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

interface PaymentLink {
  id: string;
  short_id: string;
  creator_wallet: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  chain_id: number;
  status: string;
  expires_at?: string;
  max_uses?: number;
  current_uses: number;
  total_collected: number;
  created_at: string;
  updated_at: string;
}

interface PaymentLinksTableProps {
  refreshTrigger?: number;
}

export function PaymentLinksTable({ refreshTrigger }: PaymentLinksTableProps) {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useAuth();

  const fetchPaymentLinks = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('creator_wallet', address)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentLinks(data || []);
    } catch (error) {
      console.error('Error fetching payment links:', error);
      toast.error('Failed to load payment links');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentLinks();
  }, [address, refreshTrigger]);

  const copyLink = async (shortId: string) => {
    const link = `${window.location.origin}/pay/${shortId}`;
    await navigator.clipboard.writeText(link);
    toast.success('Payment link copied to clipboard!');
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('payment_links')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Payment link ${newStatus === 'active' ? 'activated' : 'paused'}`);
      fetchPaymentLinks();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update payment link status');
    }
  };

  const deleteLink = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Payment link deleted successfully');
      fetchPaymentLinks();
    } catch (error) {
      console.error('Error deleting payment link:', error);
      toast.error('Failed to delete payment link');
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount} ${currency}`;
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'expired': return 'destructive';
      default: return 'outline';
    }
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 56: return 'BSC';
      case 43114: return 'Avalanche';
      default: return `Chain ${chainId}`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Payment Links</CardTitle>
          <CardDescription>Loading your payment links...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentLinks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Payment Links</CardTitle>
          <CardDescription>You haven't created any payment links yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Create your first payment link to start accepting payments.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Payment Links</CardTitle>
        <CardDescription>
          Manage your payment links and track payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Total Collected</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentLinks.map((link) => (
              <TableRow key={link.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{link.title}</div>
                    {link.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {link.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatAmount(link.amount, link.currency)}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getNetworkName(link.chain_id)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(link.status)}>
                    {link.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {link.max_uses 
                    ? `${link.current_uses} / ${link.max_uses}`
                    : link.current_uses
                  }
                </TableCell>
                <TableCell>
                  {formatAmount(link.total_collected, link.currency)}
                </TableCell>
                <TableCell>
                  {new Date(link.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => copyLink(link.short_id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => window.open(`/pay/${link.short_id}`, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Payment Page
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => toggleStatus(link.id, link.status)}
                      >
                        {link.status === 'active' ? (
                          <>
                            <PauseCircle className="mr-2 h-4 w-4" />
                            Pause Link
                          </>
                        ) : (
                          <>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Activate Link
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => deleteLink(link.id, link.title)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 