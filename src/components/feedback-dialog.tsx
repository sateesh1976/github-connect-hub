import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/lib/feedback.functions";

type Errors = Partial<Record<"fullName" | "phone" | "email" | "feedback", string>>;

const empty = { fullName: "", phone: "", email: "", feedback: "" };

export function FeedbackDialog() {
  const send = useServerFn(submitFeedback);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "sent") return;
    const timer = setTimeout(() => {
      setOpen(false);
      setStatus("idle");
      setValues(empty);
    }, 1800);
    return () => clearTimeout(timer);
  }, [status]);

  function validate(): boolean {
    const next: Errors = {};
    if (values.fullName.trim().length < 2) next.fullName = "Please enter your full name.";
    if (!/^[+()\-\s0-9]{7,20}$/.test(values.phone.trim())) next.phone = "Please enter a valid phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = "Please enter a valid email address.";
    if (values.feedback.trim().length < 5) next.feedback = "Please share a bit more feedback.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "sending" || status === "sent") return;
    setFormError(null);
    if (!validate()) return;

    setStatus("sending");
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
      } else {
        setStatus("idle");
        setFormError(result.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("idle");
      setFormError("Network error. Please check your connection and try again.");
    }
  }

  function field(key: keyof typeof empty) {
    return {
      value: values[key],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setValues((prev) => ({ ...prev, [key]: event.target.value })),
      "aria-invalid": Boolean(errors[key]),
    };
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 shadow-lg"
        aria-label="Open feedback form"
      >
        <MessageSquarePlus /> Feedback
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setStatus("idle");
            setErrors({});
            setFormError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share your feedback</DialogTitle>
            <DialogDescription>
              Your thoughts help improve this site. All fields are required.
            </DialogDescription>
          </DialogHeader>

          {status === "sent" ? (
            <p role="status" className="py-8 text-center text-base font-semibold text-primary">
              Thank you! Your feedback has been submitted.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div>
                <Label htmlFor="fb-name">Your full name</Label>
                <Input id="fb-name" className="mt-2" autoComplete="name" {...field("fullName")} />
                {errors.fullName && <p className="mt-1 text-sm text-destructive">{errors.fullName}</p>}
              </div>
              <div>
                <Label htmlFor="fb-phone">Your phone / mobile no.</Label>
                <Input id="fb-phone" className="mt-2" inputMode="tel" autoComplete="tel" {...field("phone")} />
                {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="fb-email">Your email</Label>
                <Input id="fb-email" className="mt-2" type="email" autoComplete="email" {...field("email")} />
                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="fb-message">What&apos;s your feedback?</Label>
                <Textarea id="fb-message" rows={5} className="mt-2" {...field("feedback")} />
                {errors.feedback && <p className="mt-1 text-sm text-destructive">{errors.feedback}</p>}
              </div>

              {formError && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {formError}
                </p>
              )}

              <Button type="submit" disabled={status === "sending"} className="w-full sm:w-auto">
                {status === "sending" && <Loader2 className="animate-spin" />}
                {status === "sending" ? "Sending…" : "Submit feedback"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
