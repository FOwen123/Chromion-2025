import { Home, LogOut, LinkIcon, LayoutDashboard } from "lucide-react"
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useActiveWallet, useDisconnect } from "thirdweb/react"
import { useAccountStore } from "@/stores/accounts"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Home",
    url: "/homepage",
    icon: Home,
  },
  {
    title: "Dashboard", 
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Payment Links",
    url: "/paymentlinks",
    icon: LinkIcon,
  },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const wallet = useActiveWallet()
  const { disconnect } = useDisconnect()
  const { logout } = useAccountStore()

  const handleLogout = async () => {
    try {
      console.log("Starting logout process...")
      
      // First call the store logout to clear auth state
      logout()
      
      // Then disconnect the wallet if connected
      if (wallet) {
        console.log("Disconnecting wallet...")
        await disconnect(wallet)
      }
      
      // Navigate to home page
      console.log("Redirecting to home page...")
      navigate({ to: '/' })
    } catch (error) {
      console.error("Error during logout:", error)
      // Still redirect even if there's an error
      navigate({ to: '/' })
    }
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-2 p-2 mb-9">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <SidebarGroupLabel className="text-lg font-semibold">LinkFi</SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link 
                        to={item.url}
                        className={`relative flex items-center gap-2 transition-colors ${
                          isActive 
                            ? 'text-blue-700 font-medium' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <item.icon className={isActive ? 'text-blue-600' : ''} />
                        <span>{item.title}</span>
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut />
                  <span className="text-red-500">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}