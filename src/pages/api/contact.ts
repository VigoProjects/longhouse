/**
 * Contact form handler — runs as a Vercel serverless function.
 * Env vars (set in Vercel, never in the repo): RESEND_API_KEY, CONTACT_TO, CONTACT_FROM,
 * plus the optional reCAPTCHA ones listed in src/lib/recaptcha.ts.
 */
import type { APIRoute } from "astro";
import { Resend } from "resend";
import { verifyRecaptcha } from "../../lib/recaptcha";

export const prerender = false;

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const form = await request.formData();
  const get = (k: string) => String(form.get(k) ?? "").trim().slice(0, 5000);

  // Bots fill the hidden honeypot field; pretend success and drop it.
  if (get("honeypot")) return json(200, { ok: true });

  const data = {
    Name: get("name"),
    Email: get("email"),
    Phone: get("phone"),
    Postcode: get("postcode"),
    Listed: get("listed"),
    Project: get("message"),
  };
  if (!data.Name || !data.Project || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Email)) {
    return json(400, { error: "Please add your name, a valid email and a short description of the project." });
  }

  const captcha = await verifyRecaptcha(get("recaptcha_token"), request.headers.get("user-agent") ?? undefined, clientAddress);
  if (!captcha.ok) {
    console.warn("Contact form blocked by reCAPTCHA:", captcha.reason);
    return json(400, { error: "Sorry, we couldn't verify that you're not a robot." });
  }

  const { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } = import.meta.env;
  if (!RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) {
    console.error("Contact form is not configured: missing env vars");
    return json(500, { error: "The form isn't set up yet." });
  }

  const rows = Object.entries(data).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;vertical-align:top"><b>${k}</b></td><td>${esc(v || "—").replace(/\n/g, "<br>")}</td></tr>`).join("");
  const { error } = await new Resend(RESEND_API_KEY).emails.send({
    from: CONTACT_FROM,
    to: CONTACT_TO.split(",").map((s: string) => s.trim()),
    replyTo: data.Email,
    subject: `New project enquiry from ${data.Name}${data.Postcode ? ` (${data.Postcode})` : ""}`,
    html: `<table>${rows}</table>`,
  });
  if (error) {
    console.error("Resend error", error);
    return json(502, { error: "Sorry, your message couldn't be sent." });
  }
  return json(200, { ok: true });
};
