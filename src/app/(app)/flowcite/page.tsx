import type { Metadata } from "next";
import { FlowCiteView } from "./flowcite-view";

export const metadata: Metadata = {
  title: "FlowCite",
  description: "Turn a question into academic sources and a Harvard reference.",
};

export default function FlowCitePage() {
  return <FlowCiteView />;
}