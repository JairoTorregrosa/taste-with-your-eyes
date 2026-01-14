"use client";

import { motion } from "framer-motion";
import { ArrowRight, Camera, Sparkles, Utensils } from "lucide-react";
import Link from "next/link";
import { Uploader } from "@/src/features/menu/Uploader";
import { ROUTES } from "@/src/lib/constants";

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

type HeroSectionProps = {
  onSelect: (dataUrl: string) => void;
  disabled?: boolean;
};

export function HeroSection({ onSelect, disabled }: HeroSectionProps) {
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
        className="mx-auto max-w-3xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl"
        >
          Taste With{" "}
          <span className="bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500 bg-clip-text text-transparent">
            Your Eyes
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={itemVariants}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-xl"
        >
          See the food before you order.
          <br />
          Upload a menu photo to preview any dish.
        </motion.p>

        {/* Flow Diagram */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex items-center justify-center gap-3 sm:gap-4"
        >
          <FlowStep
            icon={<Camera className="h-5 w-5 text-emerald-400" />}
            label="Snap a photo"
          />
          <ArrowRight className="h-4 w-4 text-zinc-400 dark:text-zinc-600" />
          <FlowStep
            icon={<Sparkles className="h-5 w-5 text-sky-400" />}
            label="AI extracts dishes"
          />
          <ArrowRight className="h-4 w-4 text-zinc-400 dark:text-zinc-600" />
          <FlowStep
            icon={<Utensils className="h-5 w-5 text-violet-400" />}
            label="Visual menu ready"
          />
        </motion.div>

        {/* Uploader */}
        <motion.div variants={itemVariants} className="mt-10">
          <Uploader onSelect={onSelect} disabled={disabled} />
        </motion.div>

        {/* Secondary link */}
        <motion.div variants={itemVariants} className="mt-8">
          <Link
            href={ROUTES.HOW_IT_WORKS}
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400"
          >
            How it works &rarr;
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

function FlowStep({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/80 dark:bg-zinc-800">
        {icon}
      </div>
      <span className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
        {label}
      </span>
    </div>
  );
}
