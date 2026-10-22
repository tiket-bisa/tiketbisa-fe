// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { blurOnWheel } from "./number-input";

afterEach(cleanup);

describe("blurOnWheel", () => {
  it("drops focus from a number input when the wheel scrolls over it", () => {
    render(<input aria-label="Jumlah tiket" type="number" defaultValue="3" onWheel={blurOnWheel} />);
    const input = screen.getByLabelText("Jumlah tiket") as HTMLInputElement;

    input.focus();
    expect(document.activeElement).toBe(input);

    fireEvent.wheel(input, { deltaY: 100 });

    expect(document.activeElement).not.toBe(input);
    expect(input.value).toBe("3");
  });
});
