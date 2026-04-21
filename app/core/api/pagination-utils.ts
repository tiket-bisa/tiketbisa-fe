export function getPaginationFromSearchParams(
  searchParams: URLSearchParams,
  defaultPageSize: number = 10,
) {
  const limit = Number(searchParams.get("limit") ?? defaultPageSize);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const offset = (page - 1) * limit;

  return {
    limit,
    page,
    offset,
  };
}
