import { DashboardComponent } from "@/components/Dashboard";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default function Homepage() {
    return (
        <SidebarProvider>
            <DashboardComponent />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <h1 className="text-xl font-semibold">Dashboard</h1>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4">
                    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
                        <div className="p-6">
                           
                           
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
