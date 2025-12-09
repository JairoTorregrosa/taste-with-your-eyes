"use client";

import { useRef, useState } from "react";

type Props = {
  onSelect: (dataUrl: string) => void;
  disabled?: boolean;
};

export function Uploader({ onSelect, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setError(null);
    setReading(true);
    try {
      onSelect(await toDataUrl(file));
    } catch {
      setError("Could not read image");
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Upload a menu photo
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            We'll extract dishes, descriptions, and prices
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || reading}
        >
          {reading ? "Reading…" : "Choose photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
          {error}
        </div>
      )}
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
