"use client";

import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to error reporting service
    console.error("App error:", error);
  }, [error]);

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg">Something went wrong</AlertTitle>
        <AlertDescription className="mt-4">
          <p className="mb-4 text-sm text-muted-foreground">
            We're sorry, but something unexpected happened. Our team has been
            notified.
          </p>
          {error.digest && (
            <p className="mb-4 font-mono text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={reset} variant="default" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" size="sm" onClick={handleGoHome}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
