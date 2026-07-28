// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useObjectUrlRegistry } from "./use-object-url-registry";

describe("useObjectUrlRegistry", () => {
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    createObjectURL.mockReset();
    revokeObjectURL.mockReset();
    createObjectURL.mockReturnValueOnce("blob:first").mockReturnValueOnce("blob:second");
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("revokes a registered URL only once", () => {
    const { result } = renderHook(() => useObjectUrlRegistry());
    let objectUrl = "";

    act(() => {
      objectUrl = result.current.createObjectUrl(new Blob(["image"]));
      result.current.revokeObjectUrl(objectUrl);
      result.current.revokeObjectUrl(objectUrl);
    });

    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first");
  });

  it("revokes every remaining URL on unmount", () => {
    const { result, unmount } = renderHook(() => useObjectUrlRegistry());

    act(() => {
      result.current.createObjectUrl(new Blob(["first"]));
      result.current.createObjectUrl(new Blob(["second"]));
    });
    unmount();

    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:second");
  });
});
