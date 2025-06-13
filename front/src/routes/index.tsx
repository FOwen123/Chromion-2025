import { createFileRoute } from '@tanstack/react-router'
import { HeroSection } from '../components/hero-section-9'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
      <HeroSection />
  )
}
