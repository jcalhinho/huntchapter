const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

type GeminiInlinePart = {
  inline_data?: { data?: string };
  inlineData?: { data?: string };
};

type GeminiImageResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiInlinePart[] };
  }>;
};




function jsonResponse(status: number, body: unknown, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

export default async function handler(req: Request) {
  const t0 = Date.now();
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body' });
    }

    const prompt = typeof (body as { prompt?: unknown })?.prompt === 'string'
      ? (body as { prompt: string }).prompt.trim()
      : '';

    if (!prompt) {
      return jsonResponse(400, { error: 'Missing prompt' });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return jsonResponse(500, { error: 'Server key missing' });
    }

    console.log('[api/generate-image] start', { promptLen: prompt.length });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(key)}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      console.error('[api/generate-image] upstream error', upstream.status, text.slice(0, 500));
      return jsonResponse(502, {
        error: 'Upstream error',
        status: upstream.status,
        body: text.slice(0, 500),
      });
    }

    const data = (await upstream.json()) as GeminiImageResponse;
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p) => p.inline_data || p.inlineData);
    const base64 = imgPart?.inline_data?.data ?? imgPart?.inlineData?.data;

    if (!base64) {
      console.error('[api/generate-image] no image in upstream response');
      return jsonResponse(502, { error: 'No image from upstream' });
    }

    console.log('[api/generate-image] ok', { ms: Date.now() - t0, bytes: base64.length });
    return jsonResponse(
      200,
      { image: `data:image/png;base64,${base64}` },
      { 'Cache-Control': 'no-store' },
    );
  } catch (e) {
    const err = e instanceof Error ? e : new Error('Server error');
    const aborted = err.name === 'AbortError';
    console.error('[api/generate-image] fail', { ms: Date.now() - t0, aborted, err: err.message });
    return jsonResponse(aborted ? 504 : 500, {
      error: err.message || 'Server error',
      aborted,
    });
  }
}

export const config = {
  runtime: 'edge',
} as const;
