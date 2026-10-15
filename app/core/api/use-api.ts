import { useState, useEffect, useCallback, useRef } from "react";
import { toUserFacingError } from "./api-error";

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
    const latestRequest = useRef(0);

    const refetch = useCallback(() => {
        const requestId = ++latestRequest.current;
        setLoading(true);
        setError(null);
        fetcher()
            .then((nextData) => {
                if (requestId === latestRequest.current) setData(nextData);
            })
            .catch((err) => {
                if (requestId === latestRequest.current) {
                    setError(toUserFacingError(err, "Data belum dapat dimuat. Coba muat ulang."));
                }
            })
            .finally(() => {
                if (requestId === latestRequest.current) setLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        refetch();
        return () => {
            latestRequest.current += 1;
        };
    }, [refetch]);

    return { data, loading, error, refetch };
}
