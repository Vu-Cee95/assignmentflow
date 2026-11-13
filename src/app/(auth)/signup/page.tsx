import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create an AssignmentFlow account to break your POE into gentle daily steps.",
};

export default function SignupPage() {
  return <SignupForm />;
}