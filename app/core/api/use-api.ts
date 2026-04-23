import { useState, useEffect, useCallback } from "react";

/**
 * Generic hook for API data fetching.
 * Manages loading, error, and data states.
 *
 * @param fetcher  Async function that returns the data.
 * @param deps     Dependency array — re-fetches when any dep changes.
 */
export function useApiQuery<T>(
    fetcher: () => Promise<T>,
    deps: unknown[] = [],
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(() => {
        setLoading(true);
        setError(null);
        fetcher()
            .then(setData)
            .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, loading, error, refetch };
}
