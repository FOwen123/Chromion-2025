import { createFileRoute } from '@tanstack/react-router'
import { Layout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { ArrowRight, CreditCard, BarChart3 } from 'lucide-react'

export const Route = createFileRoute('/homepage')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Layout title="Home">
      <div className="w-full">
        <h2 className="text-3xl font-bold mb-2">Welcome to LinkFi</h2>
        <p className="text-muted-foreground mb-6">Your crypto payment platform for seamless transactions</p>

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
                to="/paymentlinks"
                className="flex items-center justify-between p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
              >
                <span>Create payment link</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center justify-between p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
              >
                <span>View dashboard</span>
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
                <span className="text-muted-foreground">Total Volume</span>
                <span className="font-medium">$24,563.89</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Wallets</span>
                <span className="font-medium">7</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Success Rate</span>
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
                <div className="bg-accent rounded-full h-8 w-8 flex items-center justify-center shrink-0">1</div>
                <div>
                  <h3 className="font-medium">Connect your wallets</h3>
                  <p className="text-sm text-muted-foreground">Add your crypto wallets to start receiving payments</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-accent rounded-full h-8 w-8 flex items-center justify-center shrink-0">2</div>
                <div>
                  <h3 className="font-medium">Create payment links</h3>
                  <p className="text-sm text-muted-foreground">Generate shareable links for accepting crypto payments</p>
                  <Button variant="link" className="p-0 h-auto text-sm" asChild>
                    <Link to="/paymentlinks">
                      Create links <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-accent rounded-full h-8 w-8 flex items-center justify-center shrink-0">3</div>
                <div>
                  <h3 className="font-medium">Monitor transactions</h3>
                  <p className="text-sm text-muted-foreground">Track all your crypto payments in one place</p>
                  <Button variant="link" className="p-0 h-auto text-sm" asChild>
                    <Link to="/dashboard">
                      View dashboard <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
