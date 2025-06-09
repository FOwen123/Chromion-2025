"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardComponent } from "@/components/Dashboard";
import { CreatePaymentLinkModal } from "@/components/CreatePaymentLinkModal";
import { PaymentLinksTable } from "@/components/PaymentLinksTable";

export default function PaymentLinks() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger refresh when new link is created
  const handleLinkCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <SidebarProvider>
      <DashboardComponent />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 " />
          <h1 className="text-xl font-semibold">Payment Links</h1>
          <div className="ml-auto flex gap-2">
            <CreatePaymentLinkModal onLinkCreated={handleLinkCreated} />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            <div className="p-6 space-y-6">
              <div className="w-full">
                <h2 className="text-3xl font-bold mb-2">Payment Links</h2>
                <p className="text-zinc-400 mb-6">Create and manage your payment links</p>
              </div>
              
              {/* Payment Links Table */}
              <PaymentLinksTable refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}