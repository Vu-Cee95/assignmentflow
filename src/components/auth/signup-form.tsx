"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { User } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

export function SignupForm() {
  const { dispatch, state } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      id: uid("u"),
      name: name.trim() || "New Student",
      email: email.trim(),
      xp: 0,
      streak: 0,
      achievements: [],
      preferences: { fontSize: 100, theme: "default", reducedMotion: false },
    };
    dispatch({ type: "LOGIN", user });
    router.push("/onboarding");
  };

  if (state.isAuthenticated) {
    return (
      <p className="text-center text-sm text-muted">
        Already signed in.{" "}
        <button className="font-semibold text-calm-blue cursor-pointer" onClick={() => router.push("/dashboard")}>
          Go to dashboard →
        </button>
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <h1 className="text-xl font-bold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-muted">Two minutes to set up. Then one small step a day.</p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Full name" required>
          <TextInput
            placeholder="Thabo Nkosi"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="Student email" required>
          <TextInput
            type="email"
            placeholder="you@example.edu"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password" required hint="At least 6 characters.">
          <TextInput
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </Field>
        <label className="flex items-start gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 size-4 accent-calm-blue"
            required
          />
          <span>
            I agree to use AssignmentFlow honestly — self-reported energy stays private and reviewed by
            no one except my study buddy.
          </span>
        </label>
        <Button type="submit" size="full" disabled={!terms}>
          Create account
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-calm-blue">
          Sign in
        </Link>
      </p>
    </div>
  );
}