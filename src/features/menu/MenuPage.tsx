"use client";

import { useAction, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ConvexClientProvider, ErrorBoundary } from "@/src/components/shared";
import { ErrorBanner } from "@/src/features/menu/ErrorBanner";
import { HeroSection } from "@/src/features/menu/HeroSection";
import { LoadingState } from "@/src/features/menu/LoadingState";
import { type ImageProgress, MenuView } from "@/src/features/menu/MenuView";
import { LIMITS, STORAGE_KEYS } from "@/src/lib/constants";
import type { MenuPayload } from "@/src/lib/validation";

type FlowState = "idle" | "extracting" | "generating" | "done";

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
  const extractMenu = useAction(api.menuActions.extractMenuFromImage);

  const [sessionId, setSessionId] = useState("");
  const [menu, setMenu] = useState<MenuPayload | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [status, setStatus] = useState<FlowState>("idle");
  const [error, setError] = useState<string | null>(null);
  const menuSectionRef = useRef<HTMLDivElement>(null);

  // Subscribe to image progress when we have a menuId
  const imageProgress = useQuery(
    api.menus.getImageProgress,
    menuId && sessionId ? { menuId: menuId as Id<"menus">, sessionId } : "skip",
  ) as ImageProgress | null | undefined;

  // Load saved menu from database
  const savedMenuFromDb = useQuery(
    api.menus.getMenuById,
    menuId && sessionId && status === "idle"
      ? { menuId: menuId as Id<"menus">, sessionId }
      : "skip",
  );

  // Initialize session ID from localStorage
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEYS.SESSION);
    const sid = stored || crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEYS.SESSION, sid);
    setSessionId(sid);
    const storedMenuId = window.localStorage.getItem(STORAGE_KEYS.MENU_ID);
    if (storedMenuId) setMenuId(storedMenuId);
  }, []);

  // Transition from "generating" to "done" when:
  // 1. At least 1 image completes, OR
  // 2. All images have finished (completed + failed === total with total > 0), OR
  // 3. Menu has no items to generate images for
  useEffect(() => {
    if (status !== "generating") return;

    // imageProgress is undefined while loading, null if menu not found
    if (imageProgress === undefined) return;

    // If menu not found, transition to done (error case)
    if (imageProgress === null) {
      setStatus("done");
      setTimeout(() => {
        menuSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
      return;
    }

    const { total, completed, pending, generating } = imageProgress;

    // Calculate expected images based on menu items
    const menuItemCount =
      menu?.categories.reduce((sum, cat) => sum + cat.items.length, 0) ?? 0;
    const expectedImages = Math.min(menuItemCount, LIMITS.MAX_IMAGES_PER_MENU);

    // If menu has no items to generate, transition immediately
    if (expectedImages === 0) {
      setStatus("done");
      setTimeout(() => {
        menuSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
      return;
    }

    // If total === 0 but we expect images, wait for records to be created
    if (total === 0) return;

    const allFinished = pending === 0 && generating === 0;
    const hasAtLeastOneComplete = completed >= 1;

    // Transition to done if we have at least one image OR all work is finished
    if (hasAtLeastOneComplete || allFinished) {
      setStatus("done");

      // Smooth scroll to menu section after a brief delay
      setTimeout(() => {
        menuSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, [status, imageProgress, menu]);

  // Load menu from localStorage on mount
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

  const handleSelect = async (dataUrl: string) => {
    setStatus("extracting");
    setError(null);
    setMenu(null);
    setMenuId(null);

    try {
      // extractMenu now returns { menuId, menu } - backend handles saving internally
      const result = await extractMenu({
        sessionId,
        imageBase64: dataUrl,
      });

      const { menuId: newMenuId, menu: extracted } = result;

      setMenu(extracted);
      setMenuId(newMenuId);
      setStatus("generating");

      // Store menuId for persistence
      if (newMenuId) {
        window.localStorage.setItem(STORAGE_KEYS.MENU_ID, newMenuId);
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
    setMenuId(null);
    window.localStorage.removeItem(STORAGE_KEYS.MENU_ID);

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isProcessing = status === "extracting" || status === "generating";
  const showHero = status === "idle" && !menu;
  const showMenu = status === "done" && menu;

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
            {isProcessing && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <LoadingState
                  phase={status === "extracting" ? "extracting" : "generating"}
                  imageProgress={
                    imageProgress
                      ? {
                          total: imageProgress.total,
                          completed: imageProgress.completed,
                          generating: imageProgress.generating,
                        }
                      : undefined
                  }
                />
              </motion.div>
            )}
            {showMenu && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <MenuView
                  menu={menu}
                  onReset={reset}
                  imageProgress={imageProgress ?? undefined}
                />
              </motion.div>
            )}
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
