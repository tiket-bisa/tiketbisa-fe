export function loader() {
  return Response.json(
    { status: "healthy" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
