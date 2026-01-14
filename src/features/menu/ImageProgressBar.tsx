"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

type Props = {
  completed: number;
  total: number;
};

export function ImageProgressBar({ completed, total }: Props) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed === total && total > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl bg-zinc-100/80 px-4 py-2.5 dark:bg-zinc-800/80"
    >
      {isComplete ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-4 w-4 text-emerald-500" />
        </motion.div>
      )}

      <div className="flex flex-1 items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <motion.div
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <span className="whitespace-nowrap text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {completed} of {total} images
        </span>
      </div>
    </motion.div>
  );
}
