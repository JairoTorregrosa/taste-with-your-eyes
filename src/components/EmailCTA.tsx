import type { EmailCTAProps } from "@/src/lib/validation";
import EmailIcon from "./EmailIcon";

export default function EmailCTA({
  email,
  label = "Contact Us",
  className = "",
}: EmailCTAProps) {
  const baseClasses =
    "flex items-center gap-2 rounded-lg border-2 border-zinc-300 px-6 py-3 text-base font-semibold text-zinc-900 transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-900";

  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <a
      href={`mailto:${email}`}
      className={combinedClasses}
      aria-label={`Send email to ${email}`}
    >
      <EmailIcon />
      {label}
    </a>
  );
}
