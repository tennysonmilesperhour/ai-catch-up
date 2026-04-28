import type { ReactNode } from "react";

type SectionEyebrowProps = {
  children: ReactNode;
  className?: string;
};

export function SectionEyebrow({ children, className = "" }: SectionEyebrowProps) {
  return (
    <span className={`section-eyebrow ${className}`}>
      <span className="dot" aria-hidden />
      {children}
    </span>
  );
}
