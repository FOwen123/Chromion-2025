import { createFileRoute } from '@tanstack/react-router'
import { Layout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreatePaymentModal } from '@/components/CreatePaymentModal'
import { UserPaymentLinks } from '@/components/UserPaymentLinks'

export const Route = createFileRoute('/paymentlinks')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Layout title="Payment Links">
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Payment Links</h2>
            <p className="text-muted-foreground">Create and manage your payment links</p>
          </div>
          <CreatePaymentModal />
        </div>

        {/* Payment Links Table/Content */}
        <Card>
          <CardHeader>
            <CardTitle>Your Payment Links</CardTitle>
            <CardDescription>Manage your crypto payment links</CardDescription>
          </CardHeader>
          <CardContent>
            <UserPaymentLinks />
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
