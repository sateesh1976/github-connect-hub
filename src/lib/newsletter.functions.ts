import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const NEWSLETTER_WEBHOOK_URL = "https://pehefol.app.n8n.cloud/webhook/QuantumAILabNewsletter";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
  action: z.enum(["subscribe", "unsubscribe"]),
});

export type NewsletterInput = z.infer<typeof schema>;

export const newsletterSignup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    try {
      const url = new URL(NEWSLETTER_WEBHOOK_URL);
      url.searchParams.set("email", data.email);
      url.searchParams.set("action", data.action);

      const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
      const body = await res.text();
      if (!res.ok) {
        console.error("Newsletter webhook failed", res.status, body.slice(0, 500));
        return { ok: false as const, error: "The newsletter service rejected the request." };
      }
      return { ok: true as const };
    } catch (error) {
      console.error("Newsletter webhook error", error);
      return { ok: false as const, error: "Could not reach the newsletter service." };
    }
  });
