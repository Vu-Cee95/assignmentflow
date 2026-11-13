"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { mockUser } from "@/lib/data/mock";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

export function LoginForm() {
  const { dispatch, state } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const goOnboarding = () => {
    dispatch({ type: "LOGIN", user: mockUser });
    router.push("/onboarding");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    goOnboarding();
  };

  if (state.isAuthenticated) {
    return (
      <p className="text-center text-sm text-muted">
        You're already signed in.{" "}
        <button className="font-semibold text-calm-blue cursor-pointer" onClick={() => router.push("/dashboard")}>
          Go to dashboard →
        </button>
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <h1 className="text-xl font-bold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Break big assignments into small daily steps.</p>

      <Button size="full" className="mt-5" variant="secondary" onClick={goOnboarding}>
        <span className="grid size-5 place-items-center rounded-full bg-white text-sm font-bold text-calm-blue" aria-hidden="true">
          G
        </span>
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs font-semibold text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        or sign in with email
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Student email" required>
          <TextInput
            type="email"
            autoComplete="email"
            placeholder="you@example.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password" required>
          <TextInput
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </Field>
        <Button type="submit" size="full">
          Sign in
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        New to AssignmentFlow?{" "}
        <Link href="/signup" className="font-semibold text-calm-blue">
          Create an account
        </Link>
      </p>
    </div>
  );
}