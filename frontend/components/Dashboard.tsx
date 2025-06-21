"use client";

import { Calendar, Home, Inbox, LogOut, Search, Settings, CreditCard, LinkIcon, UserIcon, Wallet } from "lucide-react"
import Logout from "@/components/Logout"
import { useDisconnect, useActiveWallet } from "thirdweb/react";

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
    title: "Payments",
    url: "/payment",
    icon: CreditCard,
  },
  {
    title: "Payment Links",
    url: "/paymentlinks",
    icon: LinkIcon,
  },
  {
    title: "Wallets",
    url: "/wallet",
    icon: Wallet,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function DashboardComponent() {
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();

  const handleLogout = () => {    
    try {
      if (wallet) {
        console.log("Disconnecting wallet...");
        disconnect(wallet);
      } else {
        console.log("No wallet found, redirecting anyway...");
      }
      
      // Always redirect regardless of wallet state
      console.log("Redirecting to home page...");
      window.location.href = '/';
    } catch (error) {
      console.error("Error during logout:", error);
      // Still redirect even if there's an error
      window.location.href = '/';
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>

                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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