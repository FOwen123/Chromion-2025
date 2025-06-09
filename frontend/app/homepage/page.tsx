import { DashboardComponent } from "@/components/Dashboard";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CreditCard, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function Homepage() {
    return (
        <SidebarProvider>
            <DashboardComponent />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <h1 className="text-xl font-semibold">Home</h1>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4">
                    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
                        <div className="p-6 space-y-6">
        <div className="w-full">
          <h2 className="text-3xl font-bold mb-2">Welcome to LinkFi</h2>
          <p className="text-zinc-400 mb-6">Your crypto payment platform for seamless transactions</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link
                  href="/payments/create"
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  <span>Create new payment</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/payment-links/create"
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  <span>Generate payment link</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/wallets"
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  <span>Manage wallets</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Platform Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Total Volume</span>
                  <span className="font-medium">$24,563.89</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Active Wallets</span>
                  <span className="font-medium">7</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Success Rate</span>
                  <span className="font-medium">98.2%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Follow these steps to set up your crypto payment system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="bg-zinc-800 rounded-full h-8 w-8 flex items-center justify-center shrink-0">1</div>
                  <div>
                    <h3 className="font-medium">Connect your wallets</h3>
                    <p className="text-sm text-zinc-400">Add your crypto wallets to start receiving payments</p>
                    <Button variant="link" className="p-0 h-auto text-sm" asChild>
                      <Link href="/wallets">
                        Connect wallets <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-zinc-800 rounded-full h-8 w-8 flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h3 className="font-medium">Create payment links</h3>
                    <p className="text-sm text-zinc-400">Generate shareable links for accepting crypto payments</p>
                    <Button variant="link" className="p-0 h-auto text-sm" asChild>
                      <Link href="/payment-links">
                        Create links <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-zinc-800 rounded-full h-8 w-8 flex items-center justify-center shrink-0">3</div>
                  <div>
                    <h3 className="font-medium">Monitor transactions</h3>
                    <p className="text-sm text-zinc-400">Track all your crypto payments in one place</p>
                    <Button variant="link" className="p-0 h-auto text-sm" asChild>
                      <Link href="/payments">
                        View payments <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
