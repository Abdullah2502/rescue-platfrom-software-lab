import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="font-display text-6xl font-bold text-red-500 mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-4 text-slate-200">Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        The requested resource or coordination dispatch route could not be located.
      </p>
      <Link
        href="/"
        className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-mono text-xs uppercase tracking-wider text-slate-200 hover:bg-slate-700 transition"
      >
        Return to Home
      </Link>
    </div>
  );
}

