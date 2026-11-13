import type { Metadata } from "next";
import { AssignmentDetailView } from "./assignment-detail-view";

export const metadata: Metadata = {
  title: "Assignment details",
  description: "View and manage your assignment.",
};

export default function AssignmentDetailPage() {
  return <AssignmentDetailView />;
}