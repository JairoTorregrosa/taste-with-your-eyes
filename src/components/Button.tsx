import Link from "next/link";
import type { ButtonProps } from "@/src/lib/validation";

export default function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const baseClasses =
    "group relative overflow-hidden rounded-lg px-8 py-4 text-base font-semibold transition-all duration-200 sm:px-10";

  const variantClasses = {
    primary:
      "bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100 dark:hover:shadow-zinc-50/20",
    secondary:
      "border-2 border-zinc-300 text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-900",
  };

  const combinedClasses =
    `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  return (
    <Link href={href} className={combinedClasses}>
      <span className="relative z-10">{children}</span>
    </Link>
  );
}
