/**
 * Server-side reCAPTCHA check for the contact form (Google Cloud reCAPTCHA, score-based key).
 *
 * Vercel env vars:
 *   PUBLIC_RECAPTCHA_SITE_KEY  – the site key (public; also used by the browser)
 * then EITHER (simplest)
 *   RECAPTCHA_SECRET_KEY       – the key's legacy secret key (secret) → verified via SiteVerify
 * OR (Google's newer method)
 *   RECAPTCHA_PROJECT_ID       – the Google Cloud project ID that owns the key
 *   RECAPTCHA_API_KEY          – a Google Cloud API key restricted to the reCAPTCHA API (secret)
 * and optionally
 *   RECAPTCHA_MIN_SCORE        – 0.0–1.0, default 0.5 (lower = more lenient)
 *
 * If these aren't set, the check is skipped (the honeypot still applies).
 */
export const RECAPTCHA_ACTION = "contact";

export type RecaptchaResult =
  | { ok: true; skipped?: boolean; score?: number }
  | { ok: false; reason: string; score?: number };

export async function verifyRecaptcha(token: string, userAgent?: string, ip?: string): Promise<RecaptchaResult> {
  const siteKey = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY;
  const secret = import.meta.env.RECAPTCHA_SECRET_KEY;
  const projectId = import.meta.env.RECAPTCHA_PROJECT_ID;
  const apiKey = import.meta.env.RECAPTCHA_API_KEY;
  const minScore = Number(import.meta.env.RECAPTCHA_MIN_SCORE ?? 0.5);
  if (!siteKey || (!secret && !(projectId && apiKey))) return { ok: true, skipped: true };
  if (!token) return { ok: false, reason: "missing token" };
  if (secret) return siteVerify(secret, token, minScore, ip);

  let res: Response;
  try {
    res = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/assessments?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: { token, siteKey, expectedAction: RECAPTCHA_ACTION, userAgent, userIpAddress: ip },
        }),
        signal: AbortSignal.timeout(5000),
      },
    );
  } catch (e) {
    // Google unreachable: let the enquiry through rather than lose a real lead (honeypot still applies).
    console.error("reCAPTCHA request failed; allowing submission", e);
    return { ok: true, skipped: true };
  }
  if (!res.ok) {
    console.error("reCAPTCHA API error; allowing submission", res.status, await res.text().catch(() => ""));
    return { ok: true, skipped: true };
  }

  const a = (await res.json()) as {
    tokenProperties?: { valid?: boolean; invalidReason?: string; action?: string };
    riskAnalysis?: { score?: number };
  };
  const score = a.riskAnalysis?.score;
  if (!a.tokenProperties?.valid) return { ok: false, reason: `invalid token (${a.tokenProperties?.invalidReason})`, score };
  if (a.tokenProperties.action !== RECAPTCHA_ACTION) return { ok: false, reason: `unexpected action ${a.tokenProperties.action}`, score };
  if (typeof score === "number" && score < minScore) return { ok: false, reason: `low score ${score}`, score };
  return { ok: true, score };
}

/** Simpler check using the key's secret (Google's SiteVerify endpoint). */
async function siteVerify(secret: string, token: string, minScore: number, ip?: string): Promise<RecaptchaResult> {
  let res: Response;
  try {
    res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    console.error("reCAPTCHA request failed; allowing submission", e);
    return { ok: true, skipped: true };
  }
  if (!res.ok) {
    console.error("reCAPTCHA API error; allowing submission", res.status);
    return { ok: true, skipped: true };
  }
  const v = (await res.json()) as { success?: boolean; score?: number; action?: string; "error-codes"?: string[] };
  if (!v.success) return { ok: false, reason: `invalid token (${(v["error-codes"] ?? []).join(",")})`, score: v.score };
  if (v.action && v.action !== RECAPTCHA_ACTION) return { ok: false, reason: `unexpected action ${v.action}`, score: v.score };
  if (typeof v.score === "number" && v.score < minScore) return { ok: false, reason: `low score ${v.score}`, score: v.score };
  return { ok: true, score: v.score };
}
