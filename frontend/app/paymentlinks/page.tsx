import { DashboardComponent } from "@/components/Dashboard";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default function PaymentLinksPage() {
    return (
        <SidebarProvider>
            <DashboardComponent />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <h1 className="text-xl font-semibold">Payment Links</h1>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4">
                    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">Payment Links Management</h2>
                            <p className="text-muted-foreground">
                                Create, manage, and track your payment links. Share links with customers for easy payments.
                            </p>
                            {/* Add your payment links content here */}
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
} 