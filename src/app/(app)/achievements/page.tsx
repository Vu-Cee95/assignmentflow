import type { Metadata } from "next";
import { AchievementsView } from "./achievements-view";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Badges for showing up, staying consistent and finishing gentle steps.",
};

export default function AchievementsPage() {
  return <AchievementsView />;
}