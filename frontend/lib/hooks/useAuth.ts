import { useActiveAccount } from "thirdweb/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useAuth = () => {
  const account = useActiveAccount();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not already on the homepage
    if (account && window.location.pathname === '/') {
      router.push('/homepage');
    }
  }, [account, router]);

  return {
    isAuthenticated: !!account,
    address: account?.address,
    account,
    isLoading: false,
    isError: false
  };
}; 