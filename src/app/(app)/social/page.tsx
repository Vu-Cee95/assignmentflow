import type { Metadata } from "next";
import { SocialView } from "./social-view";

export const metadata: Metadata = {
  title: "Social",
  description: "Study rooms, the support wall and the community goal.",
};

export default function SocialPage() {
  return <SocialView />;
}