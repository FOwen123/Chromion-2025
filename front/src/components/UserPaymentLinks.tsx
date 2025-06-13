import { useQuery } from "@tanstack/react-query";
import { useAccountStore } from "@/stores/accounts";
import { supabase } from "@/lib/supabase/supabase-client";

const fetchPaymentLinks = async (creator_wallet: string) => {
  const { data, error } = await supabase
    .from("payment_links")
    .select("*")
    .eq("creator_wallet", creator_wallet)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export function UserPaymentLinks() {
  const { account } = useAccountStore();
  const address = account?.address;

  const { data, isLoading, error } = useQuery({
    queryKey: ["payment-links", address],
    queryFn: () => fetchPaymentLinks(address!),
    enabled: !!address,
    staleTime: 30000,
  });

  if (!address) return <div>Please connect your wallet.</div>;
  if (isLoading) return <div>Loading your payment links...</div>;
  if (error) return <div>Error loading payment links.</div>;
  if (!data || data.length === 0) return <div>No payment links found.</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Your Payment Links</h2>
      <ul className="space-y-2">
        {data.map((link: any) => (
          <li key={link.id} className="p-2 border rounded">
            <div className="font-medium">{link.title}</div>
            <div className="text-sm text-muted-foreground">{link.description}</div>
            <a
              href={`/pay/${link.short_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline text-sm"
            >
              {window.location.origin}/pay/{link.short_id}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
} 