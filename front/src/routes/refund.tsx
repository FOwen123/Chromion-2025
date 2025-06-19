import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/refund')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/refund"!</div>
}
