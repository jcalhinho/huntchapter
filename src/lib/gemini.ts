// Appels Gemini + utilitaires JSON

export async function callGemini(prompt: string): Promise<string> {
  const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (!key) throw new Error('VITE_GEMINI_API_KEY manquante. Ajoute-la dans .env.local');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('Erreur API Gemini');
  const data = await r.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export function extractJson(text: string): any | null {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

export async function generateImageWithGemini(prompt: string): Promise<string> {
  const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (!key) throw new Error('VITE_GEMINI_API_KEY manquante. Ajoute-la dans .env.local');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(key)}`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('Erreur image Gemini');
  const data = await r.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find((p: any) => p.inline_data || p.inlineData);
  const base64 = imgPart?.inline_data?.data || imgPart?.inlineData?.data;
  if (!base64) throw new Error('Image manquante dans la réponse Gemini');
  return `data:image/png;base64,${base64}`;
}