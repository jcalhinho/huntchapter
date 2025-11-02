const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
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

    console.log('[api/generate] start', { promptLen: prompt.length });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      console.error('[api/generate] upstream error', upstream.status, text.slice(0, 500));
      return jsonResponse(502, {
        error: 'Upstream error',
        status: upstream.status,
        body: text.slice(0, 500),
      });
    }

    const data = await upstream.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    console.log('[api/generate] ok', { ms: Date.now() - t0, chars: text.length });
    return jsonResponse(200, { text });
  } catch (e) {
    const err = e instanceof Error ? e : new Error('Server error');
    const aborted = err.name === 'AbortError';
    console.error('[api/generate] fail', { ms: Date.now() - t0, aborted, err: err.message });
    return jsonResponse(aborted ? 504 : 500, {
      error: err.message || 'Server error',
      aborted,
    });
  }
}

export const config = {
  runtime: 'edge',
} as const;
