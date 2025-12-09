"use client";

import {
  ConvexProvider,
  ConvexReactClient,
  useAction,
  useMutation,
  useQuery,
} from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { ErrorBanner } from "@/src/features/menu/ErrorBanner";
import { LoadingState } from "@/src/features/menu/LoadingState";
import { MenuView } from "@/src/features/menu/MenuView";
import { Uploader } from "@/src/features/menu/Uploader";
import type { MenuPayload } from "@/src/lib/validation";

type FlowState = "idle" | "processing" | "done";

interface MenuPageProps {
  convexUrl: string;
}

export function MenuPage({ convexUrl }: MenuPageProps) {
  const convexClient = useMemo(
    () => new ConvexReactClient(convexUrl),
    [convexUrl],
  );

  return (
    <ConvexProvider client={convexClient}>
      <PageContent />
    </ConvexProvider>
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
  const savedMenuFromDb = useQuery(
    api.menus.getMenuById,
    savedId && sessionId ? { menuId: savedId as Id<"menus">, sessionId } : "skip",
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("twye_session");
    const sid = stored || crypto.randomUUID();
    window.localStorage.setItem("twye_session", sid);
    setSessionId(sid);
    const menuId = window.localStorage.getItem("twye_menu_id");
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

      try {
        const result = await saveMenu({ sessionId, menu: extracted });
        if (result?.id) {
          setSavedId(result.id);
          window.localStorage.setItem("twye_menu_id", result.id);
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
    window.localStorage.removeItem("twye_menu_id");
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

  return (
    <main className="flex min-h-screen w-full items-start justify-center bg-zinc-50 px-4 py-6 dark:bg-zinc-950">
      <div className="flex w-full max-w-6xl flex-col gap-6">
        {error && (
          <ErrorBanner message={error} onRetry={() => setError(null)} />
        )}
        {isProcessing ? (
          <LoadingState />
        ) : menu ? (
          <MenuView menu={menu} onReset={reset} savedId={savedId} />
        ) : (
          <Uploader onSelect={handleSelect} disabled={isProcessing} />
        )}
      </div>
    </main>
  );
}
