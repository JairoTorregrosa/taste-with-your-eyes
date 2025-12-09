"use client";

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
      <span className="mt-0.5">⚠️</span>
      <div className="flex-1">
        <p className="font-semibold">Something went wrong</p>
        <p className="text-red-700 dark:text-red-100/90">{message}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-red-200 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-50 dark:ring-red-500/50"
          onClick={onRetry}
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
