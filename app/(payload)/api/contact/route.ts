import { getPayload } from "payload";
import { z } from "zod";

import config from "@/payload.config";

/**
 * Contact submissions for VOX.
 *
 * Replaces the old `/api/chatbot` route, which spun up a full Payload CMS
 * instance and called Gemini on every single message. This route does no model
 * inference at all — the reply is chosen client-side from a static table, so the
 * only thing that needs a server here is durable storage.
 *
 * Persistence is Payload + Postgres, which this project already runs. Chosen
 * over Netlify Forms because Netlify Forms requires the POST target to be a
 * static file, which a Next.js route never is.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("That email doesn't look right").max(200),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Add a bit more — at least 10 characters")
    .max(4000),
  intent: z.string().trim().max(40).optional(),
});

/**
 * Honeypot field, deliberately absent from `ContactSchema`.
 *
 * It has to be read off the raw body *before* validation. Two mistakes are easy
 * to make here and both defeat the honeypot completely:
 *
 * 1. Validating it (even as `z.string().max(0)`) makes a filled honeypot return
 *    422 `{field: "website"}`. The bot then learns which field to skip.
 * 2. Validating it as `.optional()` and checking the parsed value never fires,
 *    because a filled value gets stripped or rejected before the check runs.
 *
 * So: read it raw, swallow it, and never let its presence reach the client as
 * anything but `200 {ok: true}`.
 */
function honeypotTripped(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const value = (body as Record<string, unknown>).website;
  // Anything other than an absent or empty string counts as a bot. A human
  // never sees this input, so a non-string here is also not human.
  return value !== undefined && value !== null && value !== "";
}

/**
 * Per-IP fixed-window limiter. In-memory on purpose: a serverless instance is
 * disposable, so this is a speed bump against casual abuse, not a security
 * boundary. Real rate limiting belongs at the edge (Netlify supports two
 * code-based rules per project on free plans, configured in `export const config`).
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-nf-client-connection-ip") ?? "unknown";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Malformed request body." }, { status: 400 });
  }

  // Honeypot first, before any validation runs. See `honeypotTripped`.
  if (honeypotTripped(body)) {
    return Response.json({ ok: true });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return Response.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input.",
        field,
      },
      { status: 422 },
    );
  }

  const data = parsed.data;

  if (rateLimited(clientIp(request))) {
    return Response.json(
      { ok: false, error: "Too many attempts. Give it a minute." },
      { status: 429 },
    );
  }

  try {
    const payload = await getPayload({ config });

    await payload.create({
      collection: "contact-submissions",
      // The collection's access rules require an authenticated user; this route
      // is the only writer, so it must override. It never accepts client input
      // beyond the validated fields above.
      overrideAccess: true,
      data: {
        name: data.name,
        email: data.email,
        company: data.company || undefined,
        message: data.message,
        intent: data.intent || "contact",
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[contact] failed to store submission:", error);
    return Response.json(
      { ok: false, error: "Couldn't save that. Try emailing directly." },
      { status: 500 },
    );
  }
}
