"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ProgressStepper } from "./ProgressStepper";

const loadingMessages = [
  "Scanning your menu...",
  "Identifying dishes and prices...",
  "Building your digital menu...",
  "Generating beautiful images...",
  "Almost there...",
];

export function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  // Simulate progress through steps
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 2) return prev + 1;
        return prev;
      });
    }, 4000);

    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => {
      clearInterval(stepTimer);
      clearInterval(messageTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
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

        {/* Animated Message */}
        <div className="text-center">
          <motion.h2
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xl font-semibold text-zinc-900 dark:text-white sm:text-2xl"
          >
            {loadingMessages[messageIndex]}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-sm text-zinc-500 dark:text-zinc-400"
          >
            This usually takes 10-30 seconds depending on the menu size
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
            💡 <span className="font-medium">Tip:</span> The clearer your menu
            photo, the better the results!
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
