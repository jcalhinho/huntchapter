// Helpers client → API Gemini (local en direct, prod via fonctions Vercel)

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;
const isProd = !!((import.meta as any).env && (import.meta as any).env.PROD);

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${url} ${res.status}: ${text.slice(0, 500)}`);
  }

  return res.json() as Promise<T>;
}

async function callServer<T>(path: '/api/generate' | '/api/generate-image', prompt: string): Promise<T> {
  return postJson<T>(path, { prompt });
}

async function callGeminiDirect<T>(model: string, prompt: string, pick: (data: any) => T): Promise<T> {
  const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (!key) throw new Error('VITE_GEMINI_API_KEY manquante. Ajoute-la dans .env.local');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const data = await postJson<any>(url, body);
  return pick(data);
}

export async function callGemini(prompt: string): Promise<string> {
  const trimmed = prompt.trim();
  if (!trimmed) return '';

  if (isProd) {
    try {
      const data = await callServer<{ text?: string; error?: string }>('/api/generate', trimmed);
      if (typeof data?.text === 'string') return data.text;
      throw new Error(data?.error || 'Réponse JSON inattendue de /api/generate');
    } catch (err) {
      const fallbackKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      if (!fallbackKey) throw err;
      console.error('[client] /api/generate échec → fallback direct', err);
    }
  }

  return callGeminiDirect('gemini-2.0-flash', trimmed, (data) => {
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  });
}

export function extractJson(text: string): any | null {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

export async function generateImageWithGemini(prompt: string): Promise<string> {
  const trimmed = prompt.trim();
  if (!trimmed) throw new Error('Prompt image manquant');

  if (isProd) {
    try {
      const data = await callServer<{ image?: string; error?: string }>('/api/generate-image', trimmed);
      if (typeof data?.image === 'string') return data.image;
      throw new Error(data?.error || 'Réponse JSON inattendue de /api/generate-image');
    } catch (err) {
      const fallbackKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      if (!fallbackKey) throw err;
      console.error('[client] /api/generate-image échec → fallback direct', err);
    }
  }

  return callGeminiDirect('gemini-2.5-flash-image', trimmed, (data) => {
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find((p: any) => p.inline_data || p.inlineData);
    const base64 = imgPart?.inline_data?.data || imgPart?.inlineData?.data;
    if (!base64) throw new Error('Image manquante dans la réponse Gemini');
    return `data:image/png;base64,${base64}`;
  });
}
