import type { Metadata } from "next";
import { AssignmentsView } from "./assignments-view";

export const metadata: Metadata = {
  title: "Assignments",
  description: "All your assignments with progress and planned steps.",
};

export default function AssignmentsPage() {
  return <AssignmentsView />;
}