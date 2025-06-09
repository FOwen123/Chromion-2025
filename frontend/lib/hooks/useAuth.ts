import { useActiveAccount } from "thirdweb/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase, UserProfile } from "@/lib/supabase/supabase-client";

export const useAuth = () => {
  const account = useActiveAccount();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const trackedAddress = useRef<string | null>(null); // Prevent duplicate tracking
  const isLoggingOut = useRef(false); // Prevent redirects during logout

  // Optimized track user login function
  const trackUserLogin = useCallback(async (walletAddress: string) => {
    setIsLoading(true);
    setIsError(false);

    try {
      // 🚀 OPTIMIZED: Use upsert for single database call
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .upsert({
          wallet_address: walletAddress,
          last_login: new Date().toISOString(),
          is_active: true,
          // Increment login_count using SQL function
        }, {
          onConflict: 'wallet_address',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        // Fallback: Try individual operations if upsert fails
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('wallet_address', walletAddress)
          .single();

        if (existingUser) {
          // Update existing user
          const { data: updatedUser, error: updateError } = await supabase
            .from('user_profiles')
            .update({
              last_login: new Date().toISOString(),
              login_count: existingUser.login_count + 1,
              is_active: true
            })
            .eq('wallet_address', walletAddress)
            .select()
            .single();

          if (!updateError) {
            setUserProfile(updatedUser);
            console.log(`Welcome back! Login #${updatedUser.login_count}`);
          }
        } else {
          // Create new user
          const { data: newUser, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              wallet_address: walletAddress,
              login_count: 1
            })
            .select()
            .single();

          if (!insertError) {
            setUserProfile(newUser);
            console.log('New user created and logged in!');
          }
        }
      } else {
        setUserProfile(userProfile);
        console.log(`Login tracked for ${walletAddress}`);
      }
    } catch (error) {
      console.error('Error tracking user login:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle user logout
  const handleLogout = useCallback(async () => {
    console.log('useAuth: handling logout...');
    isLoggingOut.current = true; // Set logout flag to prevent redirects
    
    if (userProfile) {
      try {
        // Mark user as inactive (optional, non-blocking)
        setTimeout(async () => {
          await supabase
            .from('user_profiles')
            .update({ is_active: false })
            .eq('wallet_address', userProfile.wallet_address);
        }, 0);
      } catch (error) {
        console.error('Error updating logout status:', error);
      }
    }
    
    // Clear state immediately
    setUserProfile(null);
    setIsError(false);
    setIsLoading(false);
    
    // Reset logout flag after a delay to allow logout process to complete
    setTimeout(() => {
      isLoggingOut.current = false;
    }, 1000);
    
    console.log('useAuth: logout complete');
  }, [userProfile]);

  // Effect for wallet connection/disconnection
  useEffect(() => {
    if (account?.address && !isLoggingOut.current) {
      // Only track if this address hasn't been tracked yet this session and not logging out
      if (trackedAddress.current !== account.address) {
        trackedAddress.current = account.address;
        
        // 🚀 INSTANT REDIRECT - Don't wait for database (only if not logging out)
        if (window.location.pathname === '/') {
          // Use replace for faster navigation (no back button entry)
          router.replace('/homepage');
        }
        
        // Track login in background (fire and forget)
        setTimeout(() => trackUserLogin(account.address), 0);
      }
    } else if (!account?.address && !isLoggingOut.current) {
      // Wallet disconnected - handle logout and reset tracking (only if not already logging out)
      if (trackedAddress.current) {
        trackedAddress.current = null;
        handleLogout();
      }
    }
  }, [account?.address]); // Removed other dependencies to prevent infinite loop

  // Prefetch homepage for even faster navigation
  useEffect(() => {
    router.prefetch('/homepage');
  }, [router]);

  return {
    // ThirdWeb data (your existing returns)
    isAuthenticated: !!account,
    address: account?.address,
    account,
    isLoading,
    isError,
    
    // Supabase data (new)
    userProfile,
    isFirstTimeUser: userProfile?.login_count === 1,
    loginCount: userProfile?.login_count || 0,
    
    // Helper methods
    handleLogout
  };
}; 