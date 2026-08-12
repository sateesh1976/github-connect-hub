import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newsletterSignup } from "@/lib/newsletter.functions";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search["email"] === "string" ? search["email"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Unsubscribe | Sateesh Kumar Singh Newsletter" },
      { name: "description", content: "Unsubscribe from the Sateesh Kumar Singh / Quantum AI Lab LinkedIn newsletter mailing list." },
      { property: "og:title", content: "Unsubscribe | Sateesh Kumar Singh Newsletter" },
      { property: "og:description", content: "Manage your newsletter subscription preferences." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sateesh-singh.lovable.app/unsubscribe" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://sateesh-singh.lovable.app/unsubscribe" }],
  }),
  component: Unsubscribe,
});

function Unsubscribe() {
  const { email: initialEmail } = useSearch({ from: "/unsubscribe" });
  const run = useServerFn(newsletterSignup);
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const autoRan = useRef(false);

  async function unsubscribe(value: string) {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setStatus("sending");
    try {
      const result = await run({ data: { email: value.trim(), action: "unsubscribe" } });
      if (result.ok) {
        setEmail(value.trim());
        setStatus("done");
      } else {
        setStatus("idle");
        setError(result.error);
      }
    } catch {
      setStatus("idle");
      setError("Network error. Please try again.");
    }
  }

  useEffect(() => {
    if (autoRan.current || !initialEmail) return;
    autoRan.current = true;
    void unsubscribe(initialEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEmail]);

  return (
    <section className="section-container flex min-h-[70vh] items-center justify-center py-16">
      <div className="glass-card w-full max-w-lg p-8 text-center">
        {status === "done" ? (
          <>
            <h1 className="text-3xl font-bold">You&apos;re unsubscribed</h1>
            <p className="mt-4 text-muted-foreground">You have been unsubscribed successfully.</p>
            <p className="mt-2 font-medium">Email: {email}</p>
            <p className="mt-6 text-muted-foreground">Wishing you all the best,</p>
            <p className="font-semibold">The Sateesh Singh Team</p>
            <p className="mt-6 text-xs text-muted-foreground">© 2026 Sateesh Singh. All rights reserved.</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold">Unsubscribe</h1>
            <p className="mt-3 text-muted-foreground">
              Enter your email to stop receiving the newsletter.
            </p>
            <form
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void unsubscribe(email);
              }}
              noValidate
            >
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
              />
              <Button type="submit" disabled={status === "sending"}>
                {status === "sending" && <Loader2 className="animate-spin" />} Unsubscribe
              </Button>
            </form>
            {error && (
              <p role="alert" className="mt-3 text-sm font-medium text-destructive">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
