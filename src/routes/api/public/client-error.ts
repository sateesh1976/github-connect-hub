import { createFileRoute } from "@tanstack/react-router";

type ClientErrorPayload = {
  message?: unknown;
  stack?: unknown;
  source?: unknown;
  url?: unknown;
  userAgent?: unknown;
};

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export const Route = createFileRoute("/api/public/client-error")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: ClientErrorPayload = {};
        try {
          payload = (await request.json()) as ClientErrorPayload;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const message = clip(payload.message, 500);
        if (!message) return new Response("message required", { status: 400 });

        console.error(
          "[client-error]",
          JSON.stringify({
            message,
            source: clip(payload.source, 60),
            url: clip(payload.url, 300),
            userAgent: clip(payload.userAgent, 200),
            stack: clip(payload.stack, 4000),
            at: new Date().toISOString(),
          }),
        );

        return new Response(null, { status: 204 });
      },
    },
  },
});
