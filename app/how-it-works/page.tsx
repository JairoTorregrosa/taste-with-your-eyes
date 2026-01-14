import type { Metadata } from "next";
import { HowItWorksContent } from "@/src/features/how-it-works/HowItWorksContent";

export const metadata: Metadata = {
  title: "How It Works | Taste With Your Eyes",
  description:
    "Learn how to turn any menu photo into a visual dining experience in three simple steps.",
};

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
