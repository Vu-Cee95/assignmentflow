import type { Metadata } from "next";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = {
  title: "Today's step",
  description: "Your daily step, streak, XP and this week's focus.",
};

export default function DashboardPage() {
  return <DashboardView />;
}