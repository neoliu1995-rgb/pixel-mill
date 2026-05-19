import * as Sentry from "@sentry/nextjs";

type LogContext = Record<string, unknown>;

const logger = {
  error(message: string, context?: LogContext) {
    console.error(message, context ?? "");
    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage(message, {
        level: "error",
        extra: context,
      });
    }
  },

  warn(message: string, context?: LogContext) {
    console.warn(message, context ?? "");
    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage(message, {
        level: "warning",
        extra: context,
      });
    }
  },

  info(message: string, context?: LogContext) {
    console.log(message, context ?? "");
    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage(message, {
        level: "info",
        extra: context,
      });
    }
  },
};

export { logger };
