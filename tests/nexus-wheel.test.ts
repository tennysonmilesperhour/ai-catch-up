import { test } from "node:test";
import assert from "node:assert/strict";
import { canScrollFurther, wheelBelongsToCard } from "@/lib/nexus-wheel";

const card = (scrollTop: number) => ({ scrollTop, scrollHeight: 900, clientHeight: 500 });

test("a card with room below takes a downward wheel", () => {
  assert.equal(canScrollFurther(card(0), 40), true);
  assert.equal(canScrollFurther(card(399), 40), false); // at the bottom
});

test("a card with room above takes an upward wheel", () => {
  assert.equal(canScrollFurther(card(120), -40), true);
  assert.equal(canScrollFurther(card(0), -40), false); // at the top
});

test("a card that fits never takes the wheel", () => {
  assert.equal(canScrollFurther({ scrollTop: 0, scrollHeight: 300, clientHeight: 300 }, 40), false);
});

test("the map keeps zoom for wheels outside any card", () => {
  const svgTarget = { closest: () => null } as unknown as EventTarget;
  assert.equal(wheelBelongsToCard(svgTarget, 40), false);
  assert.equal(wheelBelongsToCard(null, 40), false);
});

test("a wheel inside a scrollable card is left to the card", () => {
  const scrollingCard = card(100);
  const inner = { closest: () => scrollingCard } as unknown as EventTarget;
  assert.equal(wheelBelongsToCard(inner, 40), true);
  assert.equal(wheelBelongsToCard(inner, -40), true);
});
