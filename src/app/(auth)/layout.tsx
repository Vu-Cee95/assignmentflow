import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 font-bold text-ink">
          <span className="grid size-9 place-items-center rounded-xl bg-calm-blue text-white">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <span className="text-lg">AssignmentFlow</span>
        </div>
        {children}
      </div>
    </div>
  );
}