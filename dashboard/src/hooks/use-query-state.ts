type QueryLike<T> = {
  isPending: boolean;
  isFetching: boolean;
  data: T | undefined;
};

type QueryState<T> = {
  data: T | undefined;
  /** True on initial load — no data has been received yet. Show a skeleton. */
  loading: boolean;
  /** True when refetching over existing data (e.g. time range change). Show a spinner overlay. */
  refetching: boolean;
};

export function useQueryState<T>(query: QueryLike<T>): QueryState<T> {
  return {
    data: query.data,
    loading: query.isPending,
    refetching: query.isFetching && !query.isPending,
  };
}
