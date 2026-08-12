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

const CHAT_WEBHOOK_URL = "https://pehefol.app.n8n.cloud/webhook/myresume-chat-assistant";

function extractReply(payload: unknown): string {
  if (typeof payload === "string") return payload.trim();
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractReply(item);
      if (found) return found;
    }
    return "";
  }
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["reply", "response", "output", "text", "message", "answer", "data"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
      if (value && typeof value === "object") {
        const nested = extractReply(value);
        if (nested) return nested;
      }
    }
  }
  return "";
}

async function askWebhook(messages: ChatMessage[]): Promise<string> {
  const last = messages[messages.length - 1];
  if (!last) return "";
  const url = new URL(CHAT_WEBHOOK_URL);
  url.searchParams.set("message", last.content);
  url.searchParams.set("chatInput", last.content);
  url.searchParams.set("history", JSON.stringify(messages.slice(-10)));

  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  const body = await res.text();
  if (!res.ok) {
    console.error("Chat webhook failed", res.status, body.slice(0, 500));
    return "";
  }
  try {
    return extractReply(JSON.parse(body));
  } catch {
    return body.trim();
  }
}

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => chatSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const webhookReply = await askWebhook(data.messages);
      if (webhookReply) return { ok: true as const, reply: webhookReply };
    } catch (error) {
      console.error("Chat webhook error", error);
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { ok: false as const, error: "The assistant is unavailable right now. Please try again shortly." };
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
