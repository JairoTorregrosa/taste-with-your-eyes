import { MenuPage } from "@/src/features/menu/MenuPage";
import { APP_TITLE } from "@/src/lib/constants";

export default function Home() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold">{APP_TITLE}</h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Missing NEXT_PUBLIC_CONVEX_URL
          </p>
        </div>
      </main>
    );
  }

  return <MenuPage convexUrl={convexUrl} />;
}
