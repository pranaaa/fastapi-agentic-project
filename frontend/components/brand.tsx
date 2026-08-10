import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Mascot: a hand-drawn "smiling bowl with steam" — warm amber gradient,
 * geometric enough to render crisply at any size, cute enough to soften the UI.
 * All inline SVG so there are no external asset dependencies.
 */
export function Mascot({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Menu Muse mascot"
    >
      <defs>
        <linearGradient id="muse-bowl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="muse-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#fdba74" />
        </linearGradient>
      </defs>

      {/* soft round background */}
      <circle cx="32" cy="32" r="30" fill="url(#muse-bg)" />

      {/* steam curls */}
      <path
        d="M22 20 C 24 16, 20 14, 22 10"
        stroke="#78350f"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
      />
      <path
        d="M32 18 C 34 14, 30 12, 32 8"
        stroke="#78350f"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
      />
      <path
        d="M42 20 C 44 16, 40 14, 42 10"
        stroke="#78350f"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
      />

      {/* bowl */}
      <path d="M10 30 h44 v4 a20 20 0 0 1 -44 0 z" fill="url(#muse-bowl)" />
      {/* bowl rim highlight */}
      <ellipse cx="32" cy="30" rx="22" ry="3" fill="#fef3c7" opacity="0.55" />

      {/* face */}
      <circle cx="24" cy="42" r="1.6" fill="#78350f" />
      <circle cx="40" cy="42" r="1.6" fill="#78350f" />
      <path
        d="M24 47 Q32 52 40 47"
        stroke="#78350f"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      {/* blush */}
      <circle cx="20" cy="46" r="1.6" fill="#fca5a5" opacity="0.7" />
      <circle cx="44" cy="46" r="1.6" fill="#fca5a5" opacity="0.7" />
    </svg>
  );
}

export function BrandLockup({
  href = "/",
  className,
  tagline,
}: {
  href?: string | null;
  className?: string;
  tagline?: string;
}) {
  const inner = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Mascot size={36} />
      <div className="flex flex-col leading-tight">
        <span className="font-serif text-lg tracking-tight">Menu Muse</span>
        {tagline && (
          <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{tagline}</span>
        )}
      </div>
    </div>
  );
  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}
