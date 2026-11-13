import type { Metadata } from "next";
import { JourneyView } from "./journey-view";

export const metadata: Metadata = {
  title: "My Journey",
  description: "Every completed step and milestone on your road to submission.",
};

export default function JourneyPage() {
  return <JourneyView />;
}