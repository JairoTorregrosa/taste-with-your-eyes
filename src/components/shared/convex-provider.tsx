"use client";

import {
  ConvexProvider as ConvexProviderBase,
  ConvexReactClient,
} from "convex/react";
import { type ReactNode, useMemo } from "react";

interface ConvexProviderProps {
  children: ReactNode;
  convexUrl: string;
}

export function ConvexClientProvider({
  children,
  convexUrl,
}: ConvexProviderProps) {
  const client = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return <ConvexProviderBase client={client}>{children}</ConvexProviderBase>;
}
