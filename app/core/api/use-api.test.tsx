// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useApiQuery } from "./use-api";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => { resolve = next; });
  return { promise, resolve };
}

describe("useApiQuery", () => {
  it("ignores an older response after the query dependencies change", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const firstFetcher = () => first.promise;
    const secondFetcher = () => second.promise;

    const { result, rerender } = renderHook(
      ({ fetcher }) => useApiQuery(fetcher, [fetcher]),
      { initialProps: { fetcher: firstFetcher } },
    );

    rerender({ fetcher: secondFetcher });
    await act(async () => { second.resolve("filter terbaru"); });
    await waitFor(() => expect(result.current.data).toBe("filter terbaru"));

    await act(async () => { first.resolve("filter lama"); });
    expect(result.current.data).toBe("filter terbaru");
  });
});
