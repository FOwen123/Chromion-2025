"use client";

import { Home, LogOut, CreditCard, LinkIcon, Wallet, LayoutDashboard } from "lucide-react"
import { useDisconnect, useActiveWallet } from "thirdweb/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

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

export function DashboardComponent() {
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {    
    try {
      console.log("Starting logout process...");
      
      // First disconnect the wallet
      if (wallet) {
        console.log("Disconnecting wallet...");
        await disconnect(wallet);
      }
      
      // Small delay to ensure wallet disconnection is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then redirect (this will trigger useAuth cleanup)
      console.log("Redirecting to home page...");
      window.location.href = '/';
    } catch (error) {
      console.error("Error during logout:", error);
      // Still redirect even if there's an error
      window.location.href = '/';
    }
  };

  return (
    <Sidebar suppressHydrationWarning>
      <SidebarContent>
        <SidebarGroup>
            <div className="flex items-center gap-2 p-2 mb-9">
              <Image src="/linkfe-removebg.png" alt="LinkFi Logo" className="w-10 h-10" width={40} height={40} />
              <SidebarGroupLabel className="text-lg font-semibold">LinkFi</SidebarGroupLabel>
            </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = mounted && pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a 
                        href={item.url}
                        className={`relative flex items-center gap-2 transition-colors ${
                          isActive 
                            ? 'text-blue-700 font-medium' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className={isActive ? 'text-blue-600' : ''} />
                        <span>{item.title}</span>
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
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