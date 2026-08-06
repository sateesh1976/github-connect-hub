import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const feedbackSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number")
    .max(20)
    .regex(/^[+()\-\s0-9]+$/, "Phone can only contain digits and + ( ) -"),
  email: z.string().trim().email("Please enter a valid email").max(255),
  feedback: z.string().trim().min(5, "Please share a bit more").max(2000),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

const WEBHOOK_URL = "https://jawepah.app.n8n.cloud/webhook/feedback";

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => feedbackSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          feedback: data.feedback,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        console.error("Feedback webhook failed", res.status, await res.text());
        return { ok: false as const, error: "The feedback service rejected the request." };
      }

      return { ok: true as const };
    } catch (err) {
      console.error("Feedback webhook error", err);
      return { ok: false as const, error: "Could not reach the feedback service." };
    }
  });
