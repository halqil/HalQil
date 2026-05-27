"use client";

import Link from "next/link";

interface NavIconProps {
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number;
  isActive?: boolean;
  ariaLabel?: string;
  className?: string;
}

/**
 * Dumaloq, orqa fonsiz, premium nav icon.
 * Badge — kichik qizil indikator (yuqori o'ng).
 * Aktiv holat — och yashil mint + kattaroq + glow.
 */
export default function NavIcon({
  icon,
  href,
  onClick,
  badge,
  isActive = false,
  ariaLabel,
  className = "",
}: NavIconProps) {
  const cls = [
    "nav-icon",
    isActive ? "nav-icon--active" : "",
    className,
  ].filter(Boolean).join(" ");

  const inner = (
    <>
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="nav-icon__badge">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls} aria-label={ariaLabel} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <button className={cls} onClick={onClick} aria-label={ariaLabel} type="button">
      {inner}
    </button>
  );
}
