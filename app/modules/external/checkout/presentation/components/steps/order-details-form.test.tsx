// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrderDetailsForm } from "./order-details-form";

describe("OrderDetailsForm validation accessibility", () => {
  it("connects an invalid buyer field to its error message", () => {
    render(
      <OrderDetailsForm
        data={{
          fullName: "",
          email: "buyer@example.com",
          phoneNumber: "081234567890",
          identityType: "KTP",
          identityNumber: "1234567890123456",
        }}
        errors={{ fullName: "Nama lengkap wajib diisi" }}
        onChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Nama Lengkap");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("fullName-error");
    expect(screen.getByText("Nama lengkap wajib diisi").id).toBe("fullName-error");
  });
});
