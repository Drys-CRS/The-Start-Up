// One place to call Gemini for JSON, used by the Build Plan's auto-fill routes.
//
// Both callers previously did `data.candidates?.[0]?...?.text ?? "{}"` with no check
// on res.ok, so a failed call (bad model name, revoked key, quota) came back as a
// silent 200 with an empty object: the form filled in nothing and said nothing.
// This returns the real failure instead, and tries a couple of model names so one
// deprecation doesn't take the feature down.

const KEY = () => process.env.GOOGLE_AI_API_KEY || "";

export const geminiConfigured = (): boolean => !!KEY();

// Override with GEMINI_MODEL; the rest are fallbacks tried in order.
const MODELS = [process.env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"].filter(
  (m): m is string => !!m,
);

// One flat shape rather than a discriminated union: this project compiles with
// `strict: false`, where narrowing on `ok` isn't reliable.
export type GeminiResult = {
  ok: boolean;
  json?: Record<string, unknown>;
  model?: string;
  status?: number;
  message?: string;
};

export async function geminiJson(prompt: string): Promise<GeminiResult> {
  if (!KEY()) return { ok: false, status: 500, message: "GOOGLE_AI_API_KEY is not configured" };

  let last: { status: number; message: string } = { status: 502, message: "No model attempted" };

  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY()}`,
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
        const message = data?.error?.message || `HTTP ${res.status}`;
        console.error(`gemini: ${model} failed (${res.status})`, message);
        last = { status: res.status || 502, message };
        // A missing/renamed model is worth retrying with the next name; anything
        // else (auth, quota, bad request) will fail the same way for all of them.
        if (res.status === 404 || res.status === 400) continue;
        return { ok: false, ...last };
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        const reason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || "no content";
        console.error(`gemini: ${model} returned no text (${reason})`);
        last = { status: 502, message: `The AI returned no content (${reason})` };
        continue;
      }

      try {
        return { ok: true, json: JSON.parse(text), model };
      } catch {
        console.error(`gemini: ${model} returned unparsable JSON`, text.slice(0, 200));
        return { ok: false, status: 502, message: "The AI response wasn't valid JSON" };
      }
    } catch (e) {
      console.error(`gemini: ${model} threw`, e);
      last = { status: 502, message: String(e).slice(0, 200) };
    }
  }

  return { ok: false, ...last };
}
