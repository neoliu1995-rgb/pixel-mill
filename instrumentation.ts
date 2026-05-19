export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      enabled: !!process.env.SENTRY_DSN,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      enabled: !!process.env.SENTRY_DSN,
    });
  }
}

export const onRequestError = async (
  error: unknown,
  request: Readonly<{
    path: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
  }>,
  context: Readonly<{
    routerKind: "App Router" | "Pages Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    revalidateReason: "on-demand" | "stale" | undefined;
  }>
) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(error, request, context);
};
