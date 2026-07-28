import { useCallback, useEffect, useRef } from "react";

export function useObjectUrlRegistry() {
  const objectUrlsRef = useRef(new Set<string>());

  const createObjectUrl = useCallback((file: Blob) => {
    const objectUrl = URL.createObjectURL(file);
    objectUrlsRef.current.add(objectUrl);
    return objectUrl;
  }, []);

  const revokeObjectUrl = useCallback((objectUrl: string) => {
    if (!objectUrlsRef.current.delete(objectUrl)) return;
    URL.revokeObjectURL(objectUrl);
  }, []);

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;
    return () => {
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
      objectUrls.clear();
    };
  }, []);

  return { createObjectUrl, revokeObjectUrl };
}
