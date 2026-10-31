// The Nexus map zooms on mouse wheel. Its pinned node card and link card
// sit on top of the map and can be taller than the map, so they scroll.
// A wheel over a card should scroll the card while it still can, and only
// zoom the map once the card is at its top or bottom edge.

export type Scrollable = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

/** True when `el` can still scroll in the direction of `deltaY`. */
export function canScrollFurther(el: Scrollable | null, deltaY: number): boolean {
  if (!el || deltaY === 0) return false;
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 1) return false;
  return deltaY > 0 ? el.scrollTop < max - 1 : el.scrollTop > 0;
}

/** Attribute that marks a card whose own scrolling wins over map zoom. */
export const SCROLL_CARD_ATTR = "data-nexus-scroll";

/** Should the map ignore this wheel event (let the card under it scroll)? */
export function wheelBelongsToCard(
  target: EventTarget | null,
  deltaY: number
): boolean {
  const el =
    target && typeof (target as Element).closest === "function"
      ? ((target as Element).closest(`[${SCROLL_CARD_ATTR}]`) as HTMLElement | null)
      : null;
  return canScrollFurther(el, deltaY);
}
