import { SITE_URL } from "./site";

// JSON-returning AI call for the Build Plan's auto-fill, with a provider cascade.
//
// Google is tried first (cheapest for this job), then OpenRouter. The cascade exists
// because Google AI Studio credit ran out in production and took the feature down
// silently: both callers used to ignore res.ok, so a failed call returned 200 with
// an empty object and the form filled in nothing. Failures now surface as an error.

const GOOGLE_KEY = () => process.env.GOOGLE_AI_API_KEY || "";
const OPENROUTER_KEY = () => process.env.OPENROUTER_API_KEY || "";

export const aiConfigured = (): boolean => !!(GOOGLE_KEY() || OPENROUTER_KEY());

// Override with GEMINI_MODEL; the rest are fallbacks tried in order.
const GEMINI_MODELS = [process.env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash"].filter(
  (m): m is string => !!m,
);

// One flat shape rather than a discriminated union: this project compiles with
// `strict: false`, where narrowing on `ok` isn't reliable.
export type AiResult = {
  ok: boolean;
  json?: Record<string, unknown>;
  provider?: string;
  message?: string;
};

function parseJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text.replace(/```json/gi, "").replace(/```/g, "").trim());
  } catch {
    return null;
  }
}

async function viaGoogle(prompt: string): Promise<AiResult> {
  let message = "Google AI is not configured";
  if (!GOOGLE_KEY()) return { ok: false, message };

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_KEY()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
          }),
        },
      );
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        message = data?.error?.message || `HTTP ${res.status}`;
        console.error(`ai: gemini ${model} failed (${res.status})`, message);
        // A renamed or missing model is worth another name; billing and auth
        // failures will repeat for every model, so stop asking.
        if (res.status === 404) continue;
        return { ok: false, message };
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        message = `no content (${data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || "unknown"})`;
        console.error(`ai: gemini ${model} returned ${message}`);
        continue;
      }

      const json = parseJson(text);
      if (!json) {
        message = "the response wasn't valid JSON";
        continue;
      }
      return { ok: true, json, provider: `google:${model}` };
    } catch (e) {
      message = String(e).slice(0, 200);
      console.error(`ai: gemini ${model} threw`, e);
    }
  }
  return { ok: false, message };
}

async function viaOpenRouter(prompt: string): Promise<AiResult> {
  if (!OPENROUTER_KEY()) return { ok: false, message: "OpenRouter is not configured" };
  const model = process.env.OPENROUTER_JSON_MODEL || "openai/gpt-4o-mini";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": SITE_URL,
        "X-Title": "The Start Up",
      },
      body: JSON.stringify({
        model,
        max_tokens: 900,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || data?.error) {
      const message = data?.error?.message || `HTTP ${res.status}`;
      console.error(`ai: openrouter ${model} failed (${res.status})`, message);
      return { ok: false, message };
    }

    const text = data?.choices?.[0]?.message?.content;
    const json = text ? parseJson(text) : null;
    if (!json) return { ok: false, message: "the response wasn't valid JSON" };
    return { ok: true, json, provider: `openrouter:${model}` };
  } catch (e) {
    console.error("ai: openrouter threw", e);
    return { ok: false, message: String(e).slice(0, 200) };
  }
}

export async function jsonFromAI(prompt: string): Promise<AiResult> {
  if (!aiConfigured()) {
    return { ok: false, message: "no AI provider is configured" };
  }

  const google = await viaGoogle(prompt);
  if (google.ok) return google;

  const openRouter = await viaOpenRouter(prompt);
  if (openRouter.ok) return openRouter;

  // Report whichever failure is likelier to be actionable.
  return { ok: false, message: openRouter.message || google.message };
}
