import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { PrologueSchema, SceneSchema, AnySceneSchema } from './schemas.js';

// ES module-safe way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GAMES_FILE_PATH = path.join(__dirname, 'games.json');

// --- TYPES ---
type Scene = z.infer<typeof AnySceneSchema> & { id: string; img?: string; };
type GameSession = {
  id: string;
  history: (Scene | { id: string, narration: string })[];
  params: { genre: string; ton: string; pov: string; cadre: string; };
}
type GeminiImageResponse = {
  candidates?: Array<{ content?: { parts?: [{ inlineData?: { data: string } }] } }>;
};


// --- IN-MEMORY STORAGE & PERSISTENCE ---
let games = new Map<string, GameSession>();

async function saveGames() {
  const data = JSON.stringify(Array.from(games.entries()), null, 2);
  await fs.writeFile(GAMES_FILE_PATH, data, 'utf-8');
}

async function loadGames() {
  try {
    const data = await fs.readFile(GAMES_FILE_PATH, 'utf-8');
    if (data) {
      games = new Map(JSON.parse(data));
      console.log(`Loaded ${games.size} games from disk.`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('games.json not found. Starting with a clean state.');
      return;
    }
    console.error("Failed to load games from disk:", error);
  }
}


// --- GEMINI API HELPERS ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function generateText<T extends z.ZodType<any, any>>(prompt: string, schema: T, maxRetries = 2): Promise<z.infer<T>> {
  let lastError: any = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API failed with status ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Invalid response structure from Gemini API");
      }

      const jsonData = JSON.parse(text);
      const validationResult = schema.safeParse(jsonData);

      if (validationResult.success) {
        return validationResult.data;
      } else {
        lastError = validationResult.error;
        throw new Error('Zod validation failed');
      }

    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed. Retrying...`);
      prompt = `${prompt}\n\nYour previous response was invalid. Please ensure your response is a valid JSON that strictly follows the requested schema. Error details: ${JSON.stringify(lastError)}`;
    }
  }
  throw new Error(`Failed to get a valid response from Gemini after ${maxRetries} attempts. Last error: ${JSON.stringify(lastError)}`);
}

async function generateImage(prompt: string): Promise<string | undefined> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `Generate a high-quality, cinematic image that illustrates the following scene: ${prompt}` },
            { text: "Output a single part with the image's raw data, no JSON." }
          ]
        }],
        generationConfig: {
          responseMimeType: "image/png"
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini Image API Error:", response.status, errorText.slice(0, 500));
      return undefined;
    }

    const data = (await response.json()) as GeminiImageResponse;
    const base64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64) {
      console.error("No image data found in Gemini's response");
      return undefined;
    }

    return `data:image/png;base64,${base64}`;

  } catch (error) {
    console.error("Failed to generate image:", error);
    return undefined;
  }
}


// --- EXPRESS APP ---
const app = express();
const port = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());


// --- API ROUTES ---

app.post('/api/game', async (req, res) => {
  try {
    const { genre, ton, pov, cadre } = req.body;
    if (!genre || !ton || !pov || !cadre) {
      return res.status(400).json({ error: 'Missing game parameters' });
    }

    const gameId = crypto.randomUUID();
    const gameParams = { genre, ton, pov, cadre };

    const prologuePrompt = `Génère le prologue d'une histoire interactive. Genre: ${genre}, Ton: ${ton}, Point de vue: ${pov}, Cadre: ${cadre}. Le prologue doit planter le décor et se terminer juste avant le premier choix du joueur. Réponds uniquement avec un JSON respectant ce schema: { "narration": "string" }`;

    const prologueResult = await generateText(prologuePrompt, PrologueSchema);

    const firstScene: Scene = {
      id: crypto.randomUUID(),
      ...prologueResult
    };

    const newGame: GameSession = {
      id: gameId,
      params: gameParams,
      history: [firstScene],
    };
    games.set(gameId, newGame);
    await saveGames(); // Save state after creating a game

    res.status(201).json({ gameId, prologue: firstScene });

  } catch (e) {
    console.error('[POST /api/game] Error:', e);
    res.status(500).json({ error: (e as Error).message });
  }
});


app.post('/api/game/:id/choice', async (req, res) => {
    try {
        const { id: gameId } = req.params;
        const { choice } = req.body;

        const game = games.get(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const userChoice = { id: crypto.randomUUID(), narration: `> ${choice}` };
        game.history.push(userChoice);

        const context = game.history.map(s => s.narration).join('\n\n');
        const nextScenePrompt = `Voici le contexte de l'histoire: ${JSON.stringify(game.params)}. Voici l'historique des événements: \n${context}\n\nGénère la prochaine scène. L'histoire doit continuer logiquement. Réponds uniquement avec un JSON respectant l'un de ces schemas: { "narration": "string", "options": ["choix1", "choix2", "choix3"] } OU { "narration": "string", "challenge": { "question": "string", "choices": ["c1", "c2"] } } OU { "narration": "string", "endingTitle": "string", "status": "win" | "loss" }.`;

        const nextSceneResult = await generateText(nextScenePrompt, AnySceneSchema);

        const imagePrompt = `Style: ${game.params.ton}, ${game.params.genre}. Scene: ${nextSceneResult.narration.substring(0, 300)}`;
        const imageUrl = await generateImage(imagePrompt);

        const newScene: Scene = {
            id: crypto.randomUUID(),
            img: imageUrl,
            ...nextSceneResult
        };

        game.history.push(newScene);
        games.set(gameId, game);
        await saveGames(); // Save state after a choice is made

        res.status(200).json(newScene);

    } catch (e) {
        console.error(`[POST /api/game/${req.params.id}/choice] Error:`, e);
        res.status(500).json({ error: (e as Error).message });
    }
});


// Serve frontend
const clientPath = path.join(__dirname, '..', '..', 'dist');
app.use(express.static(clientPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Load games and start the server
loadGames().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
});
