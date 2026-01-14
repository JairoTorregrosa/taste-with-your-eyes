"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, RefreshCw, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { MenuPayload } from "@/src/lib/validation";

type Props = {
  menu: MenuPayload;
  onReset: () => void;
  savedId?: string | null;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export function MenuView({ menu, onReset, savedId }: Props) {
  const totalItems = menu.categories.reduce(
    (sum, cat) => sum + cat.items.length,
    0,
  );

  return (
    <motion.div
      className="w-full space-y-8"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-white to-emerald-50/30 px-6 py-6 shadow-lg dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/20"
      >
        {/* Decorative background */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-3">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-2 inline-flex items-center gap-2"
              >
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Sparkles className="h-3  w-3" />
                  AI Generated
                </span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl"
              >
                {menu.restaurantName || "Your Menu"}
              </motion.h1>
              {totalItems > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-2 text-sm text-zinc-600 dark:text-zinc-400"
                >
                  {totalItems} {totalItems === 1 ? "item" : "items"} across{" "}
                  {menu.categories.length}{" "}
                  {menu.categories.length === 1 ? "category" : "categories"}
                </motion.p>
              )}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-2.5"
            >
              {menu.branding?.primaryColor && (
                <ColorSwatch
                  label="Primary"
                  value={menu.branding.primaryColor}
                />
              )}
              {menu.branding?.accentColor && (
                <ColorSwatch label="Accent" value={menu.branding.accentColor} />
              )}
              {savedId && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-500/40"
                >
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </motion.span>
              )}
            </motion.div>
          </div>
          <motion.button
            type="button"
            onClick={onReset}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
          >
            <RefreshCw className="h-4 w-4 transition-transform group-hover:-rotate-45" />
            New menu
          </motion.button>
        </div>
      </motion.div>

      {/* Categories and Dishes */}
      <motion.div
        className="grid gap-10 lg:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {menu.categories.map((cat, catIndex) => (
          <motion.div
            key={cat.name}
            className="flex flex-col gap-6"
            variants={itemVariants}
          >
            {/* Category Header */}
            <div className="flex items-center gap-4 px-1">
              <div className="flex items-center gap-3">
                <motion.div
                  className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: catIndex * 0.2,
                  }}
                />
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                  {cat.name}
                </h2>
              </div>
              <div className="h-px flex-1 rounded-full bg-gradient-to-r from-zinc-200 via-zinc-300/50 to-transparent dark:from-zinc-800 dark:via-zinc-700/50" />
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {cat.items.length}
              </span>
            </div>

            {/* Dish Cards */}
            <div className="grid gap-5">
              {cat.items.map((item, itemIndex) => (
                <DishCard
                  key={`${item.name}-${itemIndex}`}
                  {...item}
                  index={itemIndex}
                  categoryIndex={catIndex}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Generate Another CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex justify-center pt-4"
      >
        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(16, 185, 129, 0)",
              "0 0 0 8px rgba(16, 185, 129, 0.1)",
              "0 0 0 0 rgba(16, 185, 129, 0)",
            ],
          }}
          transition={{
            boxShadow: {
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            },
          }}
          className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/40"
        >
          <RefreshCw className="h-5 w-5 transition-transform group-hover:rotate-180" />
          Generate another menu
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

const DishCard = ({
  name,
  description,
  price,
  imageUrl,
  confidence,
  index = 0,
  categoryIndex = 0,
}: {
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  confidence?: number;
  index?: number;
  categoryIndex?: number;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: categoryIndex * 0.1 + index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -4,
        boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)",
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
    >
      {imageUrl && !imageError ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200/50 dark:from-zinc-800 dark:to-zinc-900/50">
          <AnimatePresence>
            {!imageLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-800"
              />
            )}
          </AnimatePresence>

          <motion.div
            className={`relative h-full w-full transition-opacity duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={imageUrl}
              alt={name}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
            />
          </motion.div>

          {price && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute top-4 right-4 overflow-hidden rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-bold text-zinc-900 shadow-lg backdrop-blur-sm ring-1 ring-zinc-200/50 transition-transform duration-300 group-hover:scale-105 dark:bg-zinc-900/95 dark:text-white dark:ring-zinc-700/50"
            >
              {price}
            </motion.div>
          )}

          {confidence !== undefined && confidence < 0.8 && (
            <div className="absolute bottom-4 left-4 rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Low confidence
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200/30 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-950/30">
          {price && (
            <div className="absolute top-4 right-4 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-zinc-900 shadow-md ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700">
              {price}
            </div>
          )}
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60" />
            <svg
              className="absolute h-8 w-8 text-zinc-400 dark:text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="Image placeholder"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="mb-2 text-xl font-bold tracking-tight text-zinc-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400 sm:text-2xl">
          {name}
        </h3>
        {description && (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
            {description}
          </p>
        )}
      </div>
    </motion.article>
  );
};

const ColorSwatch = ({ label, value }: { label: string; value: string }) => (
  <motion.span
    whileHover={{ scale: 1.05 }}
    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
  >
    <span
      aria-hidden
      className="h-4 w-4 rounded-full border-2 border-zinc-200 shadow-sm dark:border-zinc-700"
      style={{ background: value }}
    />
    <span className="font-medium">{label}</span>
    <span className="font-mono text-[10px] opacity-70">{value}</span>
  </motion.span>
);
