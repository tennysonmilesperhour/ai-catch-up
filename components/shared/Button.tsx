import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const baseClasses =
  "inline-flex items-center justify-center px-6 py-3 font-mono text-sm uppercase tracking-[0.08em]";

const variantClasses: Record<Variant, string> = {
  primary: "glass-button-primary",
  secondary: "glass-button",
  ghost:
    "bg-transparent text-[var(--color-dark)] border border-[var(--color-border)] rounded-[10px] hover:border-[var(--color-terracotta)] transition-colors",
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
