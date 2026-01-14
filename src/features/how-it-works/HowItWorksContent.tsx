"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Camera, Sparkles, Utensils } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export function HowItWorksContent() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <motion.div
        className="mx-auto max-w-4xl px-6 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            How It Works
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            From menu photo to visual preview in three simple steps.
          </p>
        </motion.div>

        {/* 3-Step Process */}
        <motion.div
          variants={itemVariants}
          className="mt-12 grid gap-6 lg:grid-cols-3"
        >
          <StepCard
            step="01"
            icon={<Camera className="h-5 w-5" />}
            title="Take a photo of the menu"
            description="Any paper menu works — even with tiny text."
          />
          <StepCard
            step="02"
            icon={<Sparkles className="h-5 w-5" />}
            title="We extract dishes + details"
            description="Categories, items, and prices get organized automatically."
          />
          <StepCard
            step="03"
            icon={<Utensils className="h-5 w-5" />}
            title="Explore visually before ordering"
            description="See dish visuals so you can choose with confidence."
          />
        </motion.div>

        {/* FAQ Section */}
        <motion.section variants={itemVariants} className="mt-16">
          <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-white to-emerald-50/30 p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/20 sm:p-8">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Questions?
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              A few things you might be wondering.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <FaqCard
                question="Are these images the exact dish?"
                answer="They're AI-generated visuals based on the menu text. Think 'helpful preview,' not an exact photo from the kitchen."
              />
              <FaqCard
                question="What if the menu photo is blurry?"
                answer="Try again with brighter light and a flatter angle. The clearer the text, the better the results."
              />
              <FaqCard
                question="Do I need an account?"
                answer="No sign-in required. Just upload a menu photo and start browsing."
              />
            </div>
          </div>
        </motion.section>

        {/* Bottom CTA */}
        <motion.div variants={itemVariants} className="mt-16 text-center">
          <Link
            href="/#upload"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/40"
          >
            <Camera className="h-5 w-5" />
            Try it now
          </Link>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 bg-white/50 py-8 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Powered by AI • Upload any menu photo and watch the magic happen
          </p>
        </div>
      </footer>
    </main>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <span className="font-mono">{step}</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            {icon}
          </div>
        </div>
        <div className="mt-4 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </div>
        <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </div>
      </div>
    </div>
  );
}

function FaqCard({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {question}
      </div>
      <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {answer}
      </div>
    </div>
  );
}
