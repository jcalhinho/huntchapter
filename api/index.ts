import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module-safe way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


type GeminiInlinePart = {
  inline_data?: { data?: string };
  inlineData?: { data?: string };
};

type GeminiImageResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiInlinePart[] };
  }>;
};

const generateHandler = async (req: express.Request, res: express.Response) => {
  const t0 = Date.now();
  try {
    const { prompt: promptBody } = req.body;
    const prompt = typeof promptBody === 'string' ? promptBody.trim() : '';

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'Server key missing' });
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
      return res.status(502).json({
        error: 'Upstream error',
        status: upstream.status,
        body: text.slice(0, 500),
      });
    }

    const data = await upstream.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    console.log('[api/generate] ok', { ms: Date.now() - t0, chars: text.length });
    return res.status(200).json({ text });
  } catch (e) {
    const err = e instanceof Error ? e : new Error('Server error');
    const aborted = err.name === 'AbortError';
    console.error('[api/generate] fail', { ms: Date.now() - t0, aborted, err: err.message });
    return res.status(aborted ? 504 : 500).json({
      error: err.message || 'Server error',
      aborted,
    });
  }
};

const generateImageHandler = async (req: express.Request, res: express.Response) => {
  const t0 = Date.now();
  try {
    const { prompt: promptBody } = req.body;
    const prompt = typeof promptBody === 'string' ? promptBody.trim() : '';

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'Server key missing' });
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
      return res.status(502).json({
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
      return res.status(502).json({ error: 'No image from upstream' });
    }

    console.log('[api/generate-image] ok', { ms: Date.now() - t0, bytes: base64.length });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ image: `data:image/png;base64,${base64}` });
  } catch (e) {
    const err = e instanceof Error ? e : new Error('Server error');
    const aborted = err.name === 'AbortError';
    console.error('[api/generate-image] fail', { ms: Date.now() - t0, aborted, err: err.message });
    return res.status(aborted ? 504 : 500).json({
      error: err.message || 'Server error',
      aborted,
    });
  }
};


const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// API routes
app.post('/api/generate', generateHandler);
app.post('/api/generate-image', generateImageHandler);

// Serve frontend
const clientPath = path.join(__dirname, '..', '..', 'dist');
app.use(express.static(clientPath));

// For any other request, serve the index.html file
app.get('/*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
