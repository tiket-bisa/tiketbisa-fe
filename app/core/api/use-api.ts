import { useMemo, useRef } from "react";
import useSWR, { type SWRConfiguration } from "swr";

/**
 * Generic hook for API data fetching with SWR.
 * Handles cache, revalidation, loading, and error states.
 *
 * @param fetcher  Async function that returns the data.
 * @param deps     Dependency array — revalidates when any dep changes.
 * @param options  Optional SWR config.
 */
export function useApiQuery<T>(
    fetcher: () => Promise<T>,
    deps: unknown[] = [],
    options?: SWRConfiguration<T, Error>,
) {
    const cacheNamespace = useRef(Symbol("useApiQuery"));
    const swrKey = useMemo(
        () => [cacheNamespace.current, ...deps] as const,
        deps,
    );

    const { data, error, isLoading, mutate } = useSWR<T, Error>(
        swrKey,
        fetcher,
        options,
    );

    return {
        data: data ?? null,
        loading: isLoading,
        error: error?.message ?? null,
        refetch: () => mutate(),
    };
}
