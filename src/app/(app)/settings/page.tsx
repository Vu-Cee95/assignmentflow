import type { Metadata } from "next";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Theme, text size and motion preferences for AssignmentFlow.",
};

export default function SettingsPage() {
  return <SettingsView />;
}