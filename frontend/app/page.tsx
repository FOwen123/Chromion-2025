'use client';

import { HeroSection } from "@/components/hero-section-9";
import { Features } from "@/components/features-1";
import { Footer7 } from "@/components/footer-7";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Home() {
  const { isAuthenticated } = useAuth();

  // If authenticated, the hook will handle the redirect
  return (
    <main>
      <HeroSection />
      <Features />
      <Footer7 />
    </main>
  );
}
