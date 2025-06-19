import { createFileRoute } from '@tanstack/react-router'
import { Layout } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreatePaymentModal } from '@/components/CreatePaymentModal'
import { UserPaymentLinks } from '@/components/UserPaymentLinks'
import { useQueryClient } from '@tanstack/react-query'
import { useAccountStore } from '@/stores/accounts'

export const Route = createFileRoute('/paymentlinks')({
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient()
  const { account } = useAccountStore()
  const address = account?.address

  const handleLinkCreated = () => {
    // Invalidate and refetch the payment links query to show the new link
    queryClient.invalidateQueries({ queryKey: ["payment-links", address] })
  }

  return (
    <Layout title="Payment Links" >

        {/* Payment Links Table/Content */}
        <Card >
          <CardHeader>
            <CardTitle>Your Payment Links</CardTitle>
            <CardDescription>Manage your crypto payment links</CardDescription>
            <CreatePaymentModal onLinkCreated={handleLinkCreated} />
          </CardHeader>
          <CardContent>
            <UserPaymentLinks />
          </CardContent>
        </Card>
    </Layout>
  )
}
