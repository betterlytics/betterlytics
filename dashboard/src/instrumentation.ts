export async function register() {
  /*
   * This if() check is required to prevent the instrumentation from compiling for edge runtime
   * It took me a very long time to figure this out, but
   * for some reason, it is imperative that this if statement is exactly as is.
   * Any other variants, placements, or conditions will cause the instrumentation to compile to edge runtime.
   * See https://github.com/vercel/next.js/issues/61728#issuecomment-2341421113 for more details.
   */
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { env } = await import('@/lib/env');

    if (!env.REDIS_URL) {
      console.log('Redis URL is not set, skipping dashboard config reconciliation');
      return;
    }

    try {
      const { reconcileAllDashboardConfigs } = await import('@/services/dashboard');

      reconcileAllDashboardConfigs()
        .then(({ processed }) => {
          console.log(`Redis warm-up finished. processed=${processed}`);
        })
        .catch((err) => {
          console.error('Redis warm-up failed:', err);
        });
    } catch (err) {
      console.error('Redis warm-up failed:', err);
    }
  }
}
