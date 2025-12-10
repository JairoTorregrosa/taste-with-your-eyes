"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Image as ImageIcon, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type Props = {
  onSelect: (dataUrl: string) => void;
  disabled?: boolean;
};

export function Uploader({ onSelect, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDropped, setIsDropped] = useState(false);

  const handleFile = useCallback(
    async (file?: File) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setError(null);
      setReading(true);
      setIsDropped(true);

      try {
        const dataUrl = await toDataUrl(file);
        // Brief delay to show success animation
        await new Promise((resolve) => setTimeout(resolve, 400));
        onSelect(dataUrl);
      } catch {
        setError("Could not read image");
        setIsDropped(false);
      } finally {
        setReading(false);
      }
    },
    [onSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Upload Zone */}
      <motion.div
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-8 sm:p-12 transition-colors cursor-pointer ${
          isDragOver
            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/5"
            : isDropped
              ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10"
              : "border-zinc-200 bg-white/80 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600"
        }`}
        animate={{
          scale: isDragOver ? 1.02 : 1,
          boxShadow: isDragOver
            ? "0 0 40px rgba(16, 185, 129, 0.2)"
            : "0 4px 20px rgba(0, 0, 0, 0.05)",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !reading && inputRef.current?.click()}
      >
        {/* Background gradient on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-sky-500/5 opacity-0"
          animate={{ opacity: isDragOver ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative flex flex-col items-center text-center">
          {/* Icon */}
          <AnimatePresence mode="wait">
            {isDropped ? (
              <motion.div
                key="success"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mb-6"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ y: 0 }}
                animate={{ y: isDragOver ? -8 : 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-6"
              >
                <motion.div
                  className={`flex h-20 w-20 items-center justify-center rounded-full transition-colors ${
                    isDragOver
                      ? "bg-emerald-100 dark:bg-emerald-500/10"
                      : "bg-zinc-100 dark:bg-zinc-800"
                  }`}
                  animate={{
                    scale: isDragOver ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Upload
                    className={`h-10 w-10 transition-colors ${
                      isDragOver
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text */}
          <AnimatePresence mode="wait">
            {isDropped ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h3 className="text-xl font-semibold text-emerald-700 dark:text-emerald-400">
                  Processing your menu...
                </h3>
              </motion.div>
            ) : (
              <motion.div
                key="instructions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white sm:text-2xl">
                  {isDragOver ? "Drop your menu here" : "Upload a menu photo"}
                </h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
                  Drag and drop or{" "}
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    click to browse
                  </span>
                </p>
                <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
                  We'll extract dishes, descriptions, prices, and generate
                  beautiful images
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Button */}
          {!isDropped && (
            <motion.button
              type="button"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:px-8 sm:py-3.5 sm:text-base"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              disabled={disabled || reading}
            >
              <ImageIcon className="h-5 w-5" />
              {reading ? "Reading..." : "Choose photo"}
            </motion.button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 overflow-hidden"
          >
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
