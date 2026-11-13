"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Gift,
  LayoutDashboard,
  ListTodo,
  Map,
  Menu,
  Settings,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { levelFor } from "@/lib/domain/state";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assignments", label: "Assignments", icon: ListTodo },
  { href: "/flowcite", label: "FlowCite", icon: BookOpen },
  { href: "/journey", label: "My Journey", icon: Map },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/social", label: "Social", icon: Users },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/settings", label: "Settings", icon: Settings },
];

const BOTTOM_NAV = NAV_ITEMS.slice(0, 4);

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-ink">
      <span className="grid size-8 place-items-center rounded-xl bg-calm-blue text-white">
        <Sparkles size={16} aria-hidden="true" />
      </span>
      <span>
        AssignmentFlow
        <span className="block text-[10px] font-medium text-muted">one step at a time</span>
      </span>
    </Link>
  );
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
        active
          ? "bg-calm-blue-light text-calm-blue"
          : "text-muted hover:bg-line/50 hover:text-ink"
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function XpChip() {
  const { state } = useApp();
  const xp = state.user?.xp ?? 0;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-sunny-light px-3 py-1.5 text-sm font-bold text-sunny"
      title="Your XP"
    >
      <Sparkles className="size-4" aria-hidden="true" />
      {formatNumber(xp)} XP
      <span className="font-semibold text-muted">L{levelFor(xp)}</span>
    </span>
  );
}

function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <nav aria-label="Primary" className="lg:hidden">
        {BOTTOM_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-haspopup="dialog"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-line/50 hover:text-ink cursor-pointer w-full"
        >
          <Menu className="size-5 shrink-0" aria-hidden="true" />
          More
        </button>
      </nav>
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/50 cursor-pointer"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More menu"
            className="absolute right-0 top-0 h-full w-72 bg-surface p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-bold text-ink">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-line/60 cursor-pointer"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-1">
              {NAV_ITEMS.slice(4).map((item) => (
                <NavLink key={item.href} item={item} onNavigate={() => setMenuOpen(false)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem)");
    const closeOnWiden = () => {
      if (mq.matches) setSidebarOpen(false);
    };
    mq.addEventListener("change", closeOnWiden);
    closeOnWiden();
    return () => mq.removeEventListener("change", closeOnWiden);
  }, []);

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!state.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [state.isAuthenticated, state.onboardingComplete, router]);

  if (!state.isAuthenticated || !state.onboardingComplete) return null;

  const name = state.user?.name.split(" ")[0] ?? "Student";

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line bg-surface sticky top-0 h-dvh">
        <div className="p-5">
          <Logo />
        </div>
        <nav aria-label="Primary" className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <div className="m-4 rounded-2xl bg-calm-blue-light p-4">
          <p className="text-sm font-bold text-ink">Hi, {name}</p>
          <p className="text-xs text-muted mt-0.5">Keep the streak going — you are doing well.</p>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-ink/50 cursor-pointer"
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-surface shadow-2xl">
            <div className="flex items-center justify-between p-5">
              <Logo />
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-line/60 cursor-pointer"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-3">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={() => setSidebarOpen(false)} />
              ))}
            </nav>
            <div className="m-4 rounded-2xl bg-calm-blue-light p-4">
              <p className="text-sm font-bold text-ink">Hi, {name}</p>
              <p className="mt-0.5 text-xs text-muted">Keep the streak going — you are doing well.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-dvh w-full flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="grid size-10 place-items-center rounded-xl text-ink hover:bg-line/60 cursor-pointer"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <Logo />
            <XpChip />
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1 pb-20 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>

        <nav
          aria-label="Primary"
          className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur"
        >
          <div className="mx-auto grid max-w-md grid-cols-5 gap-1 px-2 py-2">
            <MobileNav />
          </div>
        </nav>
      </div>
    </div>
  );
}