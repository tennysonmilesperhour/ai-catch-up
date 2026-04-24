import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const baseClasses =
  "inline-flex items-center justify-center px-6 py-3 font-mono text-sm uppercase tracking-[0.08em] transition-colors duration-200 border";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-terracotta)] text-[var(--color-cream)] border-[var(--color-terracotta)] hover:bg-[var(--color-rust)] hover:border-[var(--color-rust)]",
  secondary:
    "bg-transparent text-[var(--color-dark)] border-[var(--color-dark)] hover:bg-[var(--color-dark)] hover:text-[var(--color-cream)]",
  ghost:
    "bg-transparent text-[var(--color-dark)] border-[var(--color-border)] hover:border-[var(--color-dark)]",
};

type CommonProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

type ButtonAsLink = CommonProps & {
  href: string;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

type ButtonAsButton = CommonProps & {
  href?: undefined;
} & Omit<
    ComponentProps<"button">,
    "className" | "children"
  >;

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", children, className = "" } = props;
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if ("href" in props && props.href) {
    const { href, variant: _v, children: _c, className: _cn, ...rest } = props;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, children: _c, className: _cn, href: _h, ...rest } =
    props as ButtonAsButton;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
