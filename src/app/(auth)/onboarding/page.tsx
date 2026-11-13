import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Set up your flow",
  description: "Tell AssignmentFlow how you study so it can plan gentle daily steps.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}