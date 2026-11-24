import type { QueryClient } from "@tanstack/react-query";


export function createListCacheUpdater<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
) {
  const setList = (update: (prev: T[]) => T[]) =>
    queryClient.setQueryData<T[]>(queryKey, (prev) => update(prev ?? []));

  return {
    add: (item: T) => setList((prev) => [...prev, item]),
    update: (id: string, updated: T) =>
      setList((prev) => prev.map((item) => (item.id === id ? updated : item))),
    remove: (id: string) => setList((prev) => prev.filter((item) => item.id !== id)),
  };
}
