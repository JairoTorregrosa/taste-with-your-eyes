"use client";

import { motion } from "framer-motion";
import { ProgressStepper } from "./ProgressStepper";

type ImageProgressData = {
  total: number;
  completed: number;
  generating: number;
};

type Props = {
  phase: "extracting" | "generating";
  imageProgress?: ImageProgressData;
};

const extractingMessages = [
  "Scanning your menu...",
  "Identifying dishes and prices...",
  "Extracting text from image...",
];

const generatingMessages = [
  "Creating beautiful images...",
  "Visualizing your dishes...",
  "Almost there...",
];

export function LoadingState({ phase, imageProgress }: Props) {
  // Determine current step based on phase
  const currentStep = phase === "extracting" ? 0 : 2;

  // Get the appropriate message based on phase and progress
  const getMessage = () => {
    if (phase === "extracting") {
      return extractingMessages[0];
    }

    if (imageProgress && imageProgress.completed > 0) {
      return `Generated ${imageProgress.completed} of ${imageProgress.total} images...`;
    }

    if (imageProgress && imageProgress.generating > 0) {
      return generatingMessages[1];
    }

    return generatingMessages[0];
  };

  const getSubMessage = () => {
    if (phase === "extracting") {
      return "Analyzing your menu photo...";
    }

    if (imageProgress) {
      const remaining = imageProgress.total - imageProgress.completed;
      if (remaining > 0) {
        return `${remaining} image${remaining === 1 ? "" : "s"} remaining`;
      }
      return "Finishing up...";
    }

    return "This usually takes 10-30 seconds";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-2xl"
    >
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-12">
        {/* Animated Logo */}
        <div className="mb-8 flex justify-center">
          <motion.div
            className="relative flex h-24 w-24 items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-emerald-500/20"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            {/* Inner spinner */}
            <div className="absolute inset-2 rounded-full border-4 border-zinc-200 border-t-emerald-500 dark:border-zinc-700 dark:border-t-emerald-400" />
            {/* Center icon */}
            <motion.div
              className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600"
              animate={{ scale: [1, 0.9, 1] }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <span className="text-2xl">🍽️</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <ProgressStepper currentStep={currentStep} />
        </div>

        {/* Real-time progress for generating phase */}
        {phase === "generating" && imageProgress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="mx-auto max-w-xs">
              <div className="mb-2 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Generating images</span>
                <span>
                  {imageProgress.completed}/{imageProgress.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${imageProgress.total > 0 ? (imageProgress.completed / imageProgress.total) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Message */}
        <div className="text-center">
          <motion.h2
            key={getMessage()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xl font-semibold text-zinc-900 dark:text-white sm:text-2xl"
          >
            {getMessage()}
          </motion.h2>
          <motion.p
            key={getSubMessage()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-sm text-zinc-500 dark:text-zinc-400"
          >
            {getSubMessage()}
          </motion.p>
        </div>

        {/* Fun fact or tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 rounded-2xl bg-gradient-to-r from-emerald-50 to-sky-50 p-4 text-center dark:from-emerald-500/5 dark:to-sky-500/5"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            💡 <span className="font-medium">Tip:</span>{" "}
            {phase === "extracting"
              ? "The clearer your menu photo, the better the results!"
              : "AI is creating unique images for each dish!"}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
