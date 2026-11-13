import type { Metadata } from "next";
import { EditAssignmentView } from "./edit-assignment-view";

export const metadata: Metadata = {
  title: "Edit assignment",
  description: "Update your assignment details and step plan.",
};

export default function EditAssignmentPage() {
  return <EditAssignmentView />;
}