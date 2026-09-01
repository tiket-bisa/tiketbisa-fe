// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HubungiPage from "./hubungi.page";

afterEach(cleanup);

describe("HubungiPage", () => {
  it("shows the official WhatsApp number and opens the matching chat", () => {
    render(<HubungiPage />);

    const whatsappLink = screen.getByRole("link", {
      name: "Hubungi Tiketbisa melalui WhatsApp di +62 877-9120-1695",
    });

    expect(whatsappLink.textContent).toBe("+62 877-9120-1695");
    expect(whatsappLink.getAttribute("href")).toBe("https://wa.me/6287791201695");
    expect(whatsappLink.getAttribute("target")).toBe("_blank");
  });
});
