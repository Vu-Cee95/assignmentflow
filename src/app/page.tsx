"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

export default function Home() {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!state.isAuthenticated) router.replace("/login");
    else if (!state.onboardingComplete) router.replace("/onboarding");
    else router.replace("/dashboard");
  }, [state.isAuthenticated, state.onboardingComplete, router]);

  return null;
}