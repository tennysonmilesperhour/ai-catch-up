type Variant = "nexus" | "nebula" | "stars";

const VARIANT_FILE: Record<Variant, string> = {
  nexus: "/bg/nexus.jpg",
  nebula: "/bg/nebula.jpg",
  stars: "/bg/stars.jpg",
};

// Opacity of the page-color tint laid over the image. Higher = more readable
// for content-heavy pages, lower = more visible image for showcase moments.
const VARIANT_TINT: Record<Variant, number> = {
  nexus: 0.5,
  nebula: 0.45,
  stars: 0.55,
};

/**
 * Full-viewport background image that sits behind every page element.
 * Gets layered with a tint of the current page bg color so foreground
 * content stays legible regardless of the image.
 *
 * Drop one of these at the top of any page that should carry a custom
 * cosmic background. The actual JPEG lives at /public/bg/<variant>.jpg.
 */
export function PageBackdrop({ variant }: { variant: Variant }) {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${VARIANT_FILE[variant]})` }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `var(--color-cream)`,
          opacity: VARIANT_TINT[variant],
        }}
      />
    </div>
  );
}
