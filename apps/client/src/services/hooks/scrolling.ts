import { useState, useRef, useEffect } from "react";

import { DEFAULT_ITEMS_TO_LOAD } from "../apis/api";
import { Interval } from "../intervals";

export function useInfiniteScroll<T>(
  interval: Interval,
  call: (
    start: Date,
    end: Date,
    nb: number,
    offset: number,
  ) => Promise<{ data: T[] }>,
  filter?: (item: T) => boolean,
) {
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const ref = useRef<(force?: boolean) => void>(() => {});
  const activeRequest = useRef(0);
  const loading = useRef(false);

  ref.current = async (isNew = false) => {
    if (!hasMore && !isNew) return;
    if (loading.current && !isNew) return;
    const requestId = ++activeRequest.current;
    loading.current = true;
    setIsLoading(true);
    try {
      const result = await call(
        interval.start,
        interval.end,
        DEFAULT_ITEMS_TO_LOAD,
        isNew ? 0 : items.length,
      );
      if (requestId !== activeRequest.current) return;
      const filteredData = filter ? result.data.filter(filter) : result.data;
      if (isNew) {
        setItems([...filteredData]);
      } else {
        setItems([...items, ...filteredData]);
      }
      setHasMore(result.data.length === DEFAULT_ITEMS_TO_LOAD);
    } catch (e) {
      console.error(e);
    } finally {
      if (requestId === activeRequest.current) {
        loading.current = false;
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    activeRequest.current += 1;
    loading.current = false;
    setIsLoading(false);
    setHasMore(true);
    setItems([]);
    setTimeout(() => ref.current?.(true), 0);
  }, [interval]);

  return { items, hasMore, isLoading, onNext: ref.current };
}
