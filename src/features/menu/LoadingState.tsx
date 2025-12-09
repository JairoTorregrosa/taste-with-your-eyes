"use client";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white/70 p-10 text-center shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin dark:border-zinc-700 dark:border-t-zinc-50" />
      <div>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Turning your photo into a menu
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Extracting dishes, descriptions, and prices. This takes a few seconds.
        </p>
      </div>
    </div>
  );
}
