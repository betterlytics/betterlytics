// When a server action redirects across root layouts, as it does to /signin, Next resolves it with undefined
// and starts a full page load. Stay pending until the page unloads, so callers don't take that for a result.
export async function holdForRedirect<T>(action: Promise<T>): Promise<T> {
  const result = await action;
  if (result === undefined) return new Promise<T>(() => {});
  return result;
}
