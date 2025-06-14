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
    <Layout title="Payment Links" >

        {/* Payment Links Table/Content */}
        <Card >
          <CardHeader>
            <CardTitle>Your Payment Links</CardTitle>
            <CardDescription>Manage your crypto payment links</CardDescription>
            <CreatePaymentModal />
          </CardHeader>
          <CardContent>
            <UserPaymentLinks />
          </CardContent>
        </Card>
    </Layout>
  )
}
