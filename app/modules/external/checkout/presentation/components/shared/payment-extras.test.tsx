// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PaymentConsent } from "./payment-extras";

afterEach(cleanup);

describe("PaymentConsent", () => {
  function renderConsent() {
    const onToggleTerms = vi.fn();
    const onTogglePrivacy = vi.fn();
    render(
      <PaymentConsent
        agreedToTerms={false}
        agreedToPrivacy={false}
        onToggleTerms={onToggleTerms}
        onTogglePrivacy={onTogglePrivacy}
        isMethodSelected
      />,
    );
    return { onToggleTerms, onTogglePrivacy };
  }

  it("opens terms in a modal without changing consent", () => {
    const { onToggleTerms } = renderConsent();
    const trigger = screen.getByRole("button", { name: "Syarat & Ketentuan" });
    trigger.focus();

    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Syarat dan Ketentuan TIKETBISA" });
    expect(dialog).toBeTruthy();
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(dialog.parentElement).toMatchObject({
      dataset: { theme: "light", trustMode: "true" },
    });
    expect(screen.getByRole("heading", { name: "Definisi dan Interpretasi" })).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
    expect(onToggleTerms).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Tutup dokumen" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(trigger);
  });

  it("opens privacy in a modal and closes it with Escape", () => {
    const { onTogglePrivacy } = renderConsent();
    fireEvent.click(screen.getByRole("button", { name: "Kebijakan Privasi & Pemrosesan Data" }));

    expect(screen.getByRole("dialog", { name: "Kebijakan Privasi dan Pemrosesan Data" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Data Pribadi yang Dikumpulkan" })).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onTogglePrivacy).not.toHaveBeenCalled();
  });
});
