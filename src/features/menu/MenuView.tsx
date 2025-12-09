"use client";

import type { MenuPayload } from "@/src/lib/validation";
import Image from "next/image";
import { useState } from "react";

type Props = {
  menu: MenuPayload;
  onReset: () => void;
  savedId?: string | null;
};

export function MenuView({ menu, onReset, savedId }: Props) {
  const totalItems = menu.categories.reduce(
    (sum, cat) => sum + cat.items.length,
    0,
  );

  return (
    <div className="w-full space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50/50 px-6 py-6 shadow-sm transition-all duration-300 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950/50">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                {menu.restaurantName || "Your Menu"}
              </h1>
              {totalItems > 0 && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {totalItems} {totalItems === 1 ? "item" : "items"} across{" "}
                  {menu.categories.length}{" "}
                  {menu.categories.length === 1 ? "category" : "categories"}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 transition-all dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-500/40">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Saved
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="group flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Start over
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {menu.categories.map((cat, catIndex) => (
          <div
            key={cat.name}
            className="flex flex-col gap-6"
            style={{
              animationDelay: `${catIndex * 100}ms`,
            }}
          >
            <div className="flex items-center gap-4 px-1">
              <div className="flex items-center gap-3">
                <div
                  className="h-1 w-1 rounded-full bg-zinc-400 dark:bg-zinc-500"
                  aria-hidden
                />
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                  {cat.name}
                </h2>
              </div>
              <div className="h-px flex-1 rounded-full bg-gradient-to-r from-zinc-200 via-zinc-300/50 to-transparent dark:from-zinc-800 dark:via-zinc-700/50" />
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {cat.items.length}
              </span>
            </div>

            <div className="grid gap-5">
              {cat.items.map((item, itemIndex) => (
                <DishCard
                  key={`${item.name}-${itemIndex}`}
                  {...item}
                  index={itemIndex}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DishCard = ({
  name,
  description,
  price,
  imageUrl,
  confidence,
  index = 0,
}: {
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  confidence?: number;
  index?: number;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-500 hover:border-zinc-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 50}ms both`,
      }}
    >
      {imageUrl && !imageError ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200/50 dark:from-zinc-800 dark:to-zinc-900/50">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
          )}

          <div
            className={`relative h-full w-full transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"
              }`}
          >
            <ProgressiveImage
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
            />
          </div>

          {price && (
            <div className="absolute top-4 right-4 overflow-hidden rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-bold text-zinc-900 shadow-lg backdrop-blur-sm ring-1 ring-zinc-200/50 transition-all duration-300 group-hover:scale-105 dark:bg-zinc-900/95 dark:text-white dark:ring-zinc-700/50">
              {price}
            </div>
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
        <h3 className="mb-2 text-xl font-bold tracking-tight text-zinc-900 transition-colors group-hover:text-zinc-700 dark:text-white dark:group-hover:text-zinc-100 sm:text-2xl">
          {name}
        </h3>
        {description && (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
            {description}
          </p>
        )}
      </div>
    </article>
  );
};

const ProgressiveImage = ({
  src,
  alt,
  className = "",
  onLoad,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}) => (
  <Image
    src={src}
    alt={alt}
    fill
    unoptimized
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className={className}
    onLoad={onLoad}
    onError={onError}
  />
);

const ColorSwatch = ({ label, value }: { label: string; value: string }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
    <span
      aria-hidden
      className="h-4 w-4 rounded-full border-2 border-zinc-200 shadow-sm dark:border-zinc-700"
      style={{ background: value }}
    />
    <span className="font-medium">{label}</span>
    <span className="font-mono text-[10px] opacity-70">{value}</span>
  </span>
);
