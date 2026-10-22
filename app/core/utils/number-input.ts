import type { WheelEvent } from "react";

/**
 * Stops the mouse wheel from stepping a focused number input. Browsers change the value when the
 * pointer scrolls over a focused `type="number"` field, so a user scrolling the page silently
 * edits the quantity. React registers wheel listeners as passive, so `preventDefault` has no
 * effect here; dropping focus is what keeps the value unchanged while the page still scrolls.
 */
export function blurOnWheel(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
}
