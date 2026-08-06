import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/lib/feedback.functions";

const FORM_LINK = "https://jawepah.app.n8n.cloud/form/f7f83134-926f-4be1-8fcd-ed25877114ed";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Share Your Feedback | PlusOne" },
      {
        name: "description",
        content:
          "Tell us what's working and what isn't. Send your name, phone, email and feedback straight to our team.",
      },
      { property: "og:title", content: "Share Your Feedback | PlusOne" },
      {
        property: "og:description",
        content:
          "Tell us what's working and what isn't. Send your name, phone, email and feedback straight to our team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Errors = Partial<Record<"fullName" | "phone" | "email" | "feedback", string>>;

function Index() {
  const send = useServerFn(submitFeedback);
  const [values, setValues] = useState({ fullName: "", phone: "", email: "", feedback: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const set = (key: keyof typeof values) => (v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  function validate(): boolean {
    const next: Errors = {};
    if (values.fullName.trim().length < 2) next.fullName = "Please enter your full name";
    if (!/^[+()\-\s0-9]{7,20}$/.test(values.phone.trim()))
      next.phone = "Please enter a valid phone / mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = "Please enter a valid email address";
    if (values.feedback.trim().length < 5) next.feedback = "Please share a bit more";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    setMessage("");
    try {
      const result = await send({
        data: {
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          feedback: values.feedback.trim(),
        },
      });
      if (result.ok) {
        setStatus("sent");
        setValues({ fullName: "", phone: "", email: "", feedback: "" });
      } else {
        setStatus("error");
        setMessage(result.error);
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            We're listening
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Share your feedback
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Fill in the form below and it goes straight to our team. Prefer the hosted version?{" "}
            <a
              href={FORM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4"
            >
              Open the feedback form
            </a>
            .
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Your full name</Label>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              maxLength={100}
              value={values.fullName}
              onChange={(e) => set("fullName")(e.target.value)}
              placeholder="Jane Doe"
            />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Your phone / mobile no</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
              value={values.phone}
              onChange={(e) => set("phone")(e.target.value)}
              placeholder="+91 98765 43210"
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Your correct email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={255}
              value={values.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder="jane@example.com"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">What's your feedback</Label>
            <Textarea
              id="feedback"
              name="feedback"
              rows={5}
              maxLength={2000}
              value={values.feedback}
              onChange={(e) => set("feedback")(e.target.value)}
              placeholder="Tell us what you think..."
            />
            {errors.feedback && <p className="text-sm text-destructive">{errors.feedback}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : "Send feedback"}
          </Button>

          {status === "sent" && (
            <p className="text-sm font-medium text-primary" role="status">
              Thanks! Your feedback has been sent.
            </p>
          )}
          {status === "error" && (
            <p className="text-sm text-destructive" role="alert">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
