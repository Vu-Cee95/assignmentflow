import type { Metadata } from "next";
import { CreateAssignmentView } from "./create-assignment-view";

export const metadata: Metadata = {
  title: "Plan a new assignment",
  description: "Add an assignment and let AssignmentFlow carve it into gentle daily steps.",
};

export default function CreateAssignmentPage() {
  return <CreateAssignmentView />;
}