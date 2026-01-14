"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ConvexClientProvider, ErrorBoundary } from "@/src/components/shared";
import { ErrorBanner } from "@/src/features/menu/ErrorBanner";
import { HeroSection } from "@/src/features/menu/HeroSection";
import { LoadingState } from "@/src/features/menu/LoadingState";
import { MenuView } from "@/src/features/menu/MenuView";
import { STORAGE_KEYS } from "@/src/lib/constants";
import type { MenuPayload } from "@/src/lib/validation";

type FlowState = "idle" | "processing" | "done";

export interface MenuPageProps {
  convexUrl: string;
}

export function MenuPage({ convexUrl }: MenuPageProps) {
  return (
    <ErrorBoundary>
      <ConvexClientProvider convexUrl={convexUrl}>
        <PageContent />
      </ConvexClientProvider>
    </ErrorBoundary>
  );
}

function PageContent() {
  const extractMenu = useAction(api.menus.extractMenuFromImage);
  const saveMenu = useMutation(api.menus.saveMenu);

  const [sessionId, setSessionId] = useState("");
  const [menu, setMenu] = useState<MenuPayload | null>(null);
  const [status, setStatus] = useState<FlowState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const menuSectionRef = useRef<HTMLDivElement>(null);

  const savedMenuFromDb = useQuery(
    api.menus.getMenuById,
    savedId && sessionId
      ? { menuId: savedId as Id<"menus">, sessionId }
      : "skip",
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEYS.SESSION);
    const sid = stored || crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEYS.SESSION, sid);
    setSessionId(sid);
    const menuId = window.localStorage.getItem(STORAGE_KEYS.MENU_ID);
    if (menuId) setSavedId(menuId);
  }, []);

  const handleSelect = async (dataUrl: string) => {
    setStatus("processing");
    setError(null);
    setMenu(null);
    setSavedId(null);

    try {
      const { menu: extracted } = await extractMenu({
        sessionId,
        imageBase64: dataUrl,
      });
      setMenu(extracted);
      setStatus("done");

      // Smooth scroll to menu section after a brief delay
      setTimeout(() => {
        menuSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);

      try {
        const { imageBase64: _, ...menuWithoutImage } = extracted;
        const menuToSave = {
          ...menuWithoutImage,
          categories: menuWithoutImage.categories.map((cat) => ({
            ...cat,
            items: cat.items.map(({ imageUrl: _img, ...item }) => item),
          })),
        };
        const result = await saveMenu({ sessionId, menu: menuToSave });
        if (result?.id) {
          setSavedId(result.id);
          window.localStorage.setItem(STORAGE_KEYS.MENU_ID, result.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save menu");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not extract menu");
      setStatus("idle");
    }
  };

  const reset = () => {
    setMenu(null);
    setError(null);
    setStatus("idle");
    setSavedId(null);
    window.localStorage.removeItem(STORAGE_KEYS.MENU_ID);

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!menu && savedMenuFromDb) {
      setMenu({
        restaurantName: savedMenuFromDb.restaurantName,
        branding: savedMenuFromDb.branding,
        categories: savedMenuFromDb.categories,
      });
      setStatus("done");
    }
  }, [menu, savedMenuFromDb]);

  const isProcessing = status === "processing";
  const showHero = status === "idle" && !menu;

  return (
    <main className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950">
      {/* Hero Section - only visible in idle state */}
      <AnimatePresence mode="wait">
        {showHero && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <HeroSection onSelect={handleSelect} disabled={isProcessing} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div
        ref={menuSectionRef}
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col items-center gap-8">
          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full max-w-2xl overflow-hidden"
              >
                <ErrorBanner message={error} onRetry={() => setError(null)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Flow Content */}
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <LoadingState />
              </motion.div>
            ) : menu ? (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <MenuView menu={menu} onReset={reset} savedId={savedId} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 bg-white/50 py-8 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Powered by AI • Upload any menu photo and watch the magic happen
          </p>
        </div>
      </footer>
    </main>
  );
}
