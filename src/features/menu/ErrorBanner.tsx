"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 px-5 py-4 shadow-lg dark:border-red-500/30 dark:from-red-500/10 dark:to-red-500/5"
    >
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-transparent" />

      <div className="relative flex items-start gap-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20"
        >
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </motion.div>

        <div className="flex-1 pt-0.5">
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="font-semibold text-red-800 dark:text-red-200"
          >
            Something went wrong
          </motion.p>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-1 text-sm text-red-700 dark:text-red-100/90"
          >
            {message}
          </motion.p>
        </div>

        {onRetry && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-200 transition-colors hover:bg-red-50 dark:bg-red-500/20 dark:text-red-100 dark:ring-red-500/50 dark:hover:bg-red-500/30"
            onClick={onRetry}
          >
            Try again
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
