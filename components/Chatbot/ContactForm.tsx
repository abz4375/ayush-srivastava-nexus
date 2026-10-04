"use client";

import { useId, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Contact form used by Groot.
 *
 * Built from this repo's existing shadcn primitives, which are Radix-based.
 * The registry version at `@mcpcn/contact-form` was rejected because it targets
 * Base UI (`@base-ui/react`, `render` prop instead of `asChild`) — installing it
 * would mean running two primitive libraries in one design system.
 *
 * Progressive enhancement note: this is a Client Component, so it cannot submit
 * without JavaScript. That is fine for a chat widget, which only exists once JS
 * has loaded anyway. If a no-JS guarantee is ever needed, it belongs on a Server
 * Component form in the contact section, not here.
 */

export interface ContactFormValues {
  name: string;
  email: string;
  company: string;
  message: string;
}

const EMPTY: ContactFormValues = { name: "", email: "", company: "", message: "" };

export interface ContactFormProps {
  /** Which intent opened the form, stored alongside the submission. */
  intent?: string;
  onSent: () => void;
  onFailed: (message: string) => void;
  onCancel: () => void;
}

export function ContactForm({
  intent = "contact",
  onSent,
  onFailed,
  onCancel,
}: ContactFormProps) {
  const formId = useId();
  const [values, setValues] = useState<ContactFormValues>(EMPTY);
  // Honeypot state is never rendered. If something types here, it is a bot.
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const update =
    (key: keyof ContactFormValues) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setValues((prev) => ({ ...prev, [key]: event.target.value }));
      if (status === "error") {
        setStatus("idle");
        setError(null);
      }
    };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, intent, website }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "That didn't go through. Try again.";
        setStatus("error");
        setError(message);
        onFailed(message);
        return;
      }

      setValues(EMPTY);
      onSent();
    } catch {
      const message = "Network error. Check your connection and try again.";
      setStatus("error");
      setError(message);
      onFailed(message);
    }
  }

  const sending = status === "sending";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 border-t border-border p-3"
      noValidate
    >
      <p className="font-mono text-xs text-muted-foreground">
        <span className="text-primary">$</span> pass-message --to ayush
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-name`} className="font-mono text-xs">
            name
          </Label>
          <Input
            id={`${formId}-name`}
            name="name"
            value={values.name}
            onChange={update("name")}
            required
            maxLength={120}
            autoComplete="name"
            disabled={sending}
            className="font-mono"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-email`} className="font-mono text-xs">
            email
          </Label>
          <Input
            id={`${formId}-email`}
            name="email"
            type="email"
            value={values.email}
            onChange={update("email")}
            required
            maxLength={200}
            autoComplete="email"
            disabled={sending}
            className="font-mono"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-company`} className="font-mono text-xs">
          company <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={`${formId}-company`}
          name="company"
          value={values.company}
          onChange={update("company")}
          maxLength={160}
          autoComplete="organization"
          disabled={sending}
          className="font-mono"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-message`} className="font-mono text-xs">
          message
        </Label>
        <Textarea
          id={`${formId}-message`}
          name="message"
          value={values.message}
          onChange={update("message")}
          required
          minLength={10}
          maxLength={4000}
          rows={3}
          disabled={sending}
          placeholder="What are you working on?"
          className="resize-y font-mono"
        />
      </div>

      {/* Honeypot. Positioned off-screen and removed from the tab order and
          accessibility tree, so only automated submitters fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <Label htmlFor={`${formId}-website`}>Website</Label>
        <Input
          id={`${formId}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="font-mono text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={sending}
          className="font-mono"
        >
          {sending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              sending
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              send
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={sending}
          className="font-mono"
        >
          cancel
        </Button>
      </div>
    </form>
  );
}

export default ContactForm;
