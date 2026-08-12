import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newsletterSignup } from "@/lib/newsletter.functions";

export function NewsletterSignup() {
  const subscribe = useServerFn(newsletterSignup);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "sending") return;
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setStatus("sending");
    try {
      const result = await subscribe({ data: { email: email.trim(), action: "subscribe" } });
      if (result.ok) {
        setStatus("sent");
        setEmail("");
      } else {
        setStatus("idle");
        setError(result.error);
      }
    } catch {
      setStatus("idle");
      setError("Network error. Please try again.");
    }
  }

  return (
    <div className="max-w-md">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Mail className="size-4 text-primary" /> LinkedIn Newsletter
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Get Quantum AI Lab updates on Agentic AI, GenAI and data platforms.
      </p>
      {status === "sent" ? (
        <p role="status" className="mt-3 text-sm font-semibold text-primary">
          Subscribed! Please check your inbox to confirm.
        </p>
      ) : (
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={onSubmit} noValidate>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            aria-label="Email address for newsletter"
            className="sm:max-w-64"
          />
          <Button type="submit" disabled={status === "sending"}>
            {status === "sending" && <Loader2 className="animate-spin" />} Subscribe
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <a href="/unsubscribe" className="mt-2 inline-block text-xs text-muted-foreground underline hover:text-primary">
        Unsubscribe
      </a>
    </div>
  );
}
