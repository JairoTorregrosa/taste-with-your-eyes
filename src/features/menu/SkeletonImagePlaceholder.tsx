"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type Props = {
  status: "pending" | "generating" | "failed";
};

export function SkeletonImagePlaceholder({ status }: Props) {
  const isFailed = status === "failed";

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200/50 dark:from-zinc-800 dark:to-zinc-900/50">
      {/* Shimmer animation - only show when not failed */}
      {!isFailed && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          {isFailed ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                  className="h-6 w-6 text-red-500 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  role="img"
                  aria-label="Image failed to load"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                Failed to generate
              </span>
            </>
          ) : (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-8 w-8 text-emerald-500/60" />
              </motion.div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {status === "pending" ? "Waiting..." : "Generating..."}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
