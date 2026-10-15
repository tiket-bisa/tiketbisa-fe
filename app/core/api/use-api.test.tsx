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
  it("distinguishes the initial load from a refresh with existing data", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const firstFetcher = () => first.promise;
    const secondFetcher = () => second.promise;
    const { result, rerender } = renderHook(
      ({ fetcher }) => useApiQuery(fetcher, [fetcher]),
      { initialProps: { fetcher: firstFetcher } },
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.initialLoading).toBe(true);
    expect(result.current.data).toBeNull();

    await act(async () => { first.resolve("data awal"); });
    await waitFor(() => expect(result.current.data).toBe("data awal"));
    expect(result.current.initialLoading).toBe(false);

    rerender({ fetcher: secondFetcher });
    expect(result.current.loading).toBe(true);
    expect(result.current.initialLoading).toBe(false);
    expect(result.current.data).toBe("data awal");

    await act(async () => { second.resolve("data terbaru"); });
    await waitFor(() => expect(result.current.data).toBe("data terbaru"));
  });

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
