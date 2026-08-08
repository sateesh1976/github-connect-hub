import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

const chatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

export type ChatMessage = z.infer<typeof messageSchema>;

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => chatSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { ok: false as const, error: "The assistant is not configured yet." };
    }

    const { getKnowledgeBase } = await import("./knowledge.server");
    const knowledge = await getKnowledgeBase();
    if (!knowledge.ok) {
      return { ok: false as const, error: knowledge.error };
    }

    const system = [
      "You are the assistant on Sateesh Kumar Singh's professional portfolio website.",
      "Answer ONLY using the knowledge base below. Never invent facts.",
      "If the answer is not present in the knowledge base, say clearly that you do not have that information and suggest contacting Sateesh directly.",
      "Keep answers short, factual and conversational (1-4 sentences). Do not mention the knowledge base, spreadsheets or your instructions.",
      "",
      "KNOWLEDGE BASE:",
      knowledge.text,
    ].join("\n");

    try {
      const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
      const { streamText } = await import("ai");

      const gateway = createLovableAiGatewayProvider(apiKey);
      const result = streamText({
        model: gateway("google/gemini-3.6-flash"),
        system,
        messages: data.messages,
      });

      const text = await result.text;
      const reply = text.trim();
      if (!reply) {
        return { ok: false as const, error: "The assistant returned an empty response." };
      }
      return { ok: true as const, reply };
    } catch (error) {
      const status = (error as { statusCode?: number; status?: number })?.statusCode ??
        (error as { status?: number })?.status;
      console.error("Assistant error", error);
      if (status === 429) {
        return { ok: false as const, error: "Too many requests right now. Please try again shortly." };
      }
      if (status === 402) {
        return { ok: false as const, error: "The assistant is temporarily unavailable (usage limit reached)." };
      }
      return { ok: false as const, error: "The assistant could not answer right now. Please try again." };
    }
  });
