'use client';

import { HeroSection } from "@/components/hero-section-9";
import { Features } from "@/components/features-1";
import { Footer7 } from "@/components/footer-7";
import { useAuth } from "@/lib/hooks/useAuth";
import { useState, useEffect } from "react";
import Loading from "./loading";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading while mounting or auth is loading
  if (!mounted || isLoading) {
    return <Loading />;
  }

  // If authenticated, the hook will handle the redirect
  // But show content while redirect is happening
  return (
    <main>
      <HeroSection />
      <Features />
      <Footer7 />
    </main>
  );
}
