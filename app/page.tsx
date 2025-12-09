import Button from "@/src/components/Button";
import EmailCTA from "@/src/components/EmailCTA";
import { CONTACT_EMAIL, ROUTES } from "@/src/lib/constants";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-black">
      <main
        className="flex w-full max-w-4xl flex-col items-center justify-center px-6 py-16 text-center sm:px-8"
        aria-label="Main content"
      >
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col gap-6">
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl md:text-7xl">
              Build Something
              <span className="block bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-400">
                Extraordinary
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-xl">
              Transform your ideas into reality with our modern platform.
              Experience the future of innovation today.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button href={ROUTES.GET_STARTED} variant="primary">
              Get Started
            </Button>
            <Button href={ROUTES.LEARN_MORE} variant="secondary">
              Learn More
            </Button>
          </div>
        </div>
        <div className="mt-16 flex w-full justify-end">
          <EmailCTA email={CONTACT_EMAIL} />
        </div>
      </main>
    </div>
  );
}
