// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { EventCard } from "./event-card";

const event = {
  id: "event-1",
  title: "Match Day",
  imageUrl: "https://cdn.test/event.png",
  date: "Jum, 21 Agu 2026",
  location: "Jakarta",
  tickets: [],
  brandName: "Adhyaksa FC",
};

describe("EventCard brand logo", () => {
  afterEach(cleanup);

  it("renders the brand logo when available", () => {
    render(
      <MemoryRouter>
        <EventCard event={{ ...event, brandLogoUrl: "https://cdn.test/brand.png" }} />
      </MemoryRouter>,
    );

    expect(screen.getByAltText("Adhyaksa FC logo").getAttribute("src"))
      .toBe("https://cdn.test/brand.png");
  });

  it("renders the brand initial fallback without a logo", () => {
    render(
      <MemoryRouter>
        <EventCard event={event} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Adhyaksa FC logo fallback").textContent).toBe("A");
  });
});
