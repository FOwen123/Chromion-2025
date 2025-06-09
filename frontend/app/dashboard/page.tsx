import { DashboardComponent } from "@/components/Dashboard";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Wallet,
  DollarSign,
  Bitcoin,
  EclipseIcon as Ethereum,
} from "lucide-react"
import { LinkIcon } from "lucide-react" // Import LinkIcon
import { Button } from "@/components/ui/button"
import Link from "next/link"


export default function DashboardPage() {
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
                        <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$24,563.89</div>
              <p className="text-xs text-zinc-500">+12.5% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
              <Wallet className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-zinc-500">+2 new this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Payment Links</CardTitle>
              <LinkIcon className="h-4 w-4 text-zinc-500" /> {/* Use LinkIcon */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-zinc-500">3 active now</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.2%</div>
              <p className="text-xs text-zinc-500">+0.5% from last week</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
            <TabsTrigger value="balances">Wallet Balances</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest payment activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:bg-zinc-900/70 transition-colors space-y-3 sm:space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500/20 p-2.5 rounded-full border border-green-500/30 flex-shrink-0">
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <p className="font-semibold text-sm sm:text-base">Payment Received</p>
                          <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20 w-fit">
                            Completed
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-zinc-400">
                          <span className="font-mono">From: 0x7a23...45df</span>
                          <span className="hidden sm:inline">•</span>
                          <span>2 hours ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right space-y-1 flex-shrink-0">
                      <p className="font-bold text-green-500 text-lg">+0.45 ETH</p>
                      <p className="text-sm text-zinc-400">$1,245.00</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:bg-zinc-900/70 transition-colors space-y-3 sm:space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-500/20 p-2.5 rounded-full border border-red-500/30 flex-shrink-0">
                        <ArrowDownLeft className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <p className="font-semibold text-sm sm:text-base">Payment Sent</p>
                          <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20 w-fit">
                            Completed
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-zinc-400">
                          <span className="font-mono">To: 0x3f56...92ab</span>
                          <span className="hidden sm:inline">•</span>
                          <span>1 day ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right space-y-1 flex-shrink-0">
                      <p className="font-bold text-red-500 text-lg">-0.12 BTC</p>
                      <p className="text-sm text-zinc-400">$3,456.78</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:bg-zinc-900/70 transition-colors space-y-3 sm:space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500/20 p-2.5 rounded-full border border-green-500/30 flex-shrink-0">
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <p className="font-semibold text-sm sm:text-base">Payment Received</p>
                          <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20 w-fit">
                            Completed
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-zinc-400">
                          <span className="font-mono">From: 0x9c12...67ef</span>
                          <span className="hidden sm:inline">•</span>
                          <span>2 days ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right space-y-1 flex-shrink-0">
                      <p className="font-bold text-green-500 text-lg">+1,250 USDC</p>
                      <p className="text-sm text-zinc-400">$1,250.00</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:bg-zinc-900/70 transition-colors space-y-3 sm:space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-500/20 p-2.5 rounded-full border border-amber-500/30 flex-shrink-0">
                        <ArrowDownLeft className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <p className="font-semibold text-sm sm:text-base">Payment Sent</p>
                          <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-xs rounded-full border border-amber-500/20 w-fit">
                            Pending
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-zinc-400">
                          <span className="font-mono">To: 0xd45e...78bc</span>
                          <span className="hidden sm:inline">•</span>
                          <span>3 days ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right space-y-1 flex-shrink-0">
                      <p className="font-bold text-amber-500 text-lg">-0.75 ETH</p>
                      <p className="text-sm text-zinc-400">$2,075.50</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/payments">
                      View All Transactions
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="balances" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Balances</CardTitle>
                <CardDescription>Your current crypto holdings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-orange-500/20 p-2 rounded-full">
                        <Bitcoin className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">Bitcoin</p>
                        <p className="text-sm text-zinc-500">BTC</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">0.3482 BTC</p>
                      <p className="text-sm text-zinc-500">$10,245.67</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-500/20 p-2 rounded-full">
                        <Ethereum className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Ethereum</p>
                        <p className="text-sm text-zinc-500">ETH</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">2.4567 ETH</p>
                      <p className="text-sm text-zinc-500">$6,789.12</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-500/20 p-2 rounded-full">
                        <DollarSign className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">USD Coin</p>
                        <p className="text-sm text-zinc-500">USDC</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">5,432.10 USDC</p>
                      <p className="text-sm text-zinc-500">$5,432.10</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
} 