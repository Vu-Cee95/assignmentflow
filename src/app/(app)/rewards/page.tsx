import type { Metadata } from "next";
import { RewardsView } from "./rewards-view";

export const metadata: Metadata = {
  title: "Rewards",
  description: "Redeem your XP for real, everyday rewards.",
};

export default function RewardsPage() {
  return <RewardsView />;
}