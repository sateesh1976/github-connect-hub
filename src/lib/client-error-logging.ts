const ENDPOINT = "/api/public/client-error";
const MAX_REPORTS = 20;

let installed = false;
let reports = 0;

function report(message: string, stack: string | undefined, source: string) {
  if (typeof window === "undefined" || !message || reports >= MAX_REPORTS) return;
  reports += 1;
  try {
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        message,
        stack,
        source,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => undefined);
  } catch {
    /* logging must never break the app */
  }
}

export function reportClientError(error: unknown, source = "manual") {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  report(message, stack, source);
}

/** Installs window-level error listeners once, in the browser only. */
export function installClientErrorLogging() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    report(event.message || "Unknown error", event.error?.stack, "window.onerror");
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    report(
      reason instanceof Error ? reason.message : String(reason),
      reason instanceof Error ? reason.stack : undefined,
      "unhandledrejection",
    );
  });
}
