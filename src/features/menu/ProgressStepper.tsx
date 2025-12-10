"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ImageIcon, Menu, ScanLine } from "lucide-react";

const steps = [
  { id: "extract", label: "Extracting text", icon: ScanLine },
  { id: "build", label: "Building menu", icon: Menu },
  { id: "generate", label: "Generating images", icon: ImageIcon },
];

type Props = {
  currentStep?: number;
};

export function ProgressStepper({ currentStep = 0 }: Props) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted
                      ? "border-emerald-500 bg-emerald-500"
                      : isActive
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                        : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                  }`}
                  animate={{
                    scale: isActive ? [1, 1.05, 1] : 1,
                  }}
                  transition={{
                    duration: 2,
                    repeat: isActive ? Number.POSITIVE_INFINITY : 0,
                    ease: "easeInOut",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                        }}
                      >
                        <Check className="h-6 w-6 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="icon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            isActive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-zinc-400 dark:text-zinc-500"
                          }`}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pulsing ring for active step */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-emerald-500"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.div>

                {/* Label */}
                <motion.span
                  className={`mt-2 text-xs font-medium transition-colors sm:text-sm ${
                    isCompleted || isActive
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                  animate={{
                    opacity: isCompleted || isActive ? 1 : 0.6,
                  }}
                >
                  {step.label}
                </motion.span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 px-2 sm:px-4">
                  <div className="relative h-0.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-emerald-500"
                      initial={{ width: "0%" }}
                      animate={{
                        width: isCompleted ? "100%" : isActive ? "50%" : "0%",
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
