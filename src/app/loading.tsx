import { Spinner } from "@/components/ui/button";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="grid min-h-[50dvh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-calm-blue">
        <Spinner />
        <p className="text-sm font-semibold text-muted">Loading AssignmentFlow…</p>
      </div>
    </div>
  );
}