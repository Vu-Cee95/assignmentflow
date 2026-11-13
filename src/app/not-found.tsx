import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-sm text-center">
        <p className="text-6xl font-extrabold text-calm-blue" aria-hidden="true">
          404
        </p>
        <h1 className="mt-2 text-xl font-bold text-ink">This step doesn't exist</h1>
        <p className="mt-2 text-sm text-muted">
          That page isn't part of your plan. Let's get you back on track.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex rounded-xl bg-calm-blue px-5 py-3 text-sm font-semibold text-white hover:bg-calm-blue/90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}