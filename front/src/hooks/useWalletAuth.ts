import { useState, useCallback } from "react"
import { useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react"
import { useAccountStore } from "@/stores/accounts"
import { toast } from "sonner"

export function useWalletAuth() {
  const activeAccount = useActiveAccount()
  const activeWallet = useActiveWallet()
  const { disconnect } = useDisconnect()
  const { logout, login, isLoggedIn } = useAccountStore()
  const [returnToProcessFunds, setReturnToProcessFunds] = useState(false)

  const handleLogout = useCallback(async () => {
    try {
      console.log("🚪 Logging out...")
      
      setReturnToProcessFunds(true)
      logout()
      
      if (activeWallet) {
        await disconnect(activeWallet)
      }
      
      toast.success("Logged out successfully")
    } catch (error) {
      console.error("Error during logout:", error)
      toast.error("Error during logout")
    }
  }, [logout, activeWallet, disconnect])

  const handleAutoLogin = useCallback(() => {
    if (activeAccount && (!isLoggedIn || returnToProcessFunds)) {
      login(activeAccount)
      setReturnToProcessFunds(false)
    }
  }, [activeAccount, isLoggedIn, login, returnToProcessFunds])

  return {
    activeAccount,
    isLoggedIn,
    handleLogout,
    handleAutoLogin
  }
}