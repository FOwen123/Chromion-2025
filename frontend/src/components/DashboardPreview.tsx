import { Wallet, ArrowUpRight, Clock, Download } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function DashboardPreview() {
  // Sample data for revenue chart
  const revenueData = [
    { name: "Jan", revenue: 4200 },
    { name: "Feb", revenue: 5800 },
    { name: "Mar", revenue: 7500 },
    { name: "Apr", revenue: 8900 },
    { name: "May", revenue: 10200 },
    { name: "Jun", revenue: 12500 },
    { name: "Jul", revenue: 15800 },
  ]

  return (
    <section className="w-full text-white py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-balance text-4xl lg:text-5xl font-bold mb-4">Powerful Dashboard</h2>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Track all your blockchain payments in one place with real-time analytics and insights.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* Dashboard mockup */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Wallet className="h-4 w-4" />
                </div>
                <div className="bg-zinc-800 px-4 py-1 rounded-full text-sm">0x71C...8F3d</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Total Revenue</div>
                <div className="text-2xl font-bold">$12,543.21</div>
                <div className="text-green-400 text-sm flex items-center mt-2">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> +24.3%
                </div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Active Links</div>
                <div className="text-2xl font-bold">7</div>
                <div className="text-gray-400 text-sm mt-2">Last created 2h ago</div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Transactions</div>
                <div className="text-2xl font-bold">243</div>
                <div className="text-gray-400 text-sm flex items-center mt-2">
                  <Clock className="h-3 w-3 mr-1" /> Last 30 days
                </div>
              </div>
            </div>

            {/* Single Revenue Chart */}
            <div className="bg-zinc-800 p-6 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium">Revenue Overview</h3>
                  <p className="text-sm text-gray-400">Monthly revenue in USD</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-gray-400">Revenue</span>
                  </div>
                  <button className="text-sm text-gray-400 flex items-center hover:text-white transition-colors">
                    <Download className="h-4 w-4 mr-1" /> Export
                  </button>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis
                      dataKey="name"
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: "#3f3f46" }}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: "#3f3f46" }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#27272a", borderColor: "#3f3f46" }}
                      itemStyle={{ color: "#e4e4e7" }}
                      labelStyle={{ color: "#e4e4e7" }}
                      formatter={(value) => [`$${value}`, "Revenue"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ r: 6, strokeWidth: 2, fill: "#18181b" }}
                      activeDot={{ r: 8, strokeWidth: 2 }}
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-zinc-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-zinc-700">
                <div className="font-medium">Recent Transactions</div>
              </div>
              <div className="divide-y divide-zinc-700">
                {[
                  { address: "0x8F3...4d2A", amount: "0.45 ETH", time: "2m ago", status: "completed" },
                  { address: "0x3A1...9F7c", amount: "125 USDC", time: "1h ago", status: "completed" },
                  { address: "0xC72...1B3f", amount: "0.12 ETH", time: "3h ago", status: "completed" },
                ].map((tx, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{tx.address}</div>
                        <div className="text-sm text-gray-400">{tx.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{tx.amount}</div>
                      <div className="text-sm text-green-400">{tx.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
