"use client";

import { motion } from "framer-motion";
import { Camera, Sparkles, Utensils } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const floatVariants = {
  initial: { y: 0 },
  animate: {
    y: [-8, 8, -8],
    transition: {
      duration: 6,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
};

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:from-emerald-950/20 dark:via-zinc-950 dark:to-sky-950/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-gradient-radial from-emerald-500/10 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-20 left-[10%] hidden lg:block"
        variants={floatVariants}
        initial="initial"
        animate="animate"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
          <Camera className="h-8 w-8 text-white" />
        </div>
      </motion.div>

      <motion.div
        className="absolute top-32 right-[15%] hidden lg:block"
        variants={floatVariants}
        initial="initial"
        animate="animate"
        style={{ animationDelay: "2s" }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/25">
          <Utensils className="h-7 w-7 text-white" />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-24 right-[20%] hidden lg:block"
        variants={floatVariants}
        initial="initial"
        animate="animate"
        style={{ animationDelay: "4s" }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 shadow-lg shadow-violet-500/25">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="mx-auto max-w-4xl px-6 pb-8 pt-16 text-center sm:pb-12 sm:pt-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
            <Sparkles className="h-4 w-4" />
            AI-Powered Menu Extraction
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl"
        >
          Your Menu,{" "}
          <span className="bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500 bg-clip-text text-transparent">
            Digitized in Seconds
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={itemVariants}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-xl"
        >
          Upload a photo of any restaurant menu and watch it transform into a
          beautiful, interactive digital menu — complete with{" "}
          <span className="font-semibold text-zinc-900 dark:text-white">
            AI-generated dish images
          </span>
          .
        </motion.p>

        {/* Transformation Preview */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8"
        >
          <TransformationStep
            icon={<Camera className="h-6 w-6" />}
            label="Snap a photo"
            color="emerald"
          />
          <ArrowIcon />
          <TransformationStep
            icon={<Sparkles className="h-6 w-6" />}
            label="AI extracts dishes"
            color="sky"
          />
          <ArrowIcon />
          <TransformationStep
            icon={<Utensils className="h-6 w-6" />}
            label="Visual menu ready"
            color="violet"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function TransformationStep({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: "emerald" | "sky" | "violet";
}) {
  const colorClasses = {
    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    sky: "bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    violet:
      "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="hidden h-6 w-6 flex-shrink-0 text-zinc-300 dark:text-zinc-600 sm:block"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 5l7 7m0 0l-7 7m7-7H3"
      />
    </svg>
  );
}
