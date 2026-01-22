"use client";

import Navigation, { ScrollProgress } from "@/components/navigation/Navigation";
import LandingNavigation from "@/components/home/LandingNavigation";
import HomePage from "@/components/home/HomePage";
import { useAuthStore } from "@/lib/store";

export default function Page() {
  const { user, _hasHydrated } = useAuthStore();
  const isLoggedIn = !!user;

  return (
    <>
      <ScrollProgress />
      {/* Show LandingNavigation for guests, regular Navigation for logged-in users */}
      {_hasHydrated && !isLoggedIn ? <LandingNavigation /> : <Navigation />}
      <main>
        <HomePage />
      </main>
    </>
  );
}
