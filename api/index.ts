import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import crypto from 'crypto';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { PrologueSchema, AnySceneSchema } from './schemas.js';
import { STORY_CONFIG } from './storyConfig.js';

// ES module-safe way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: 'api/.env' });
const GAMES_FILE_PATH = path.join(__dirname, 'games.json');
const IMAGE_STYLES = [
  'Blade Runner inspired neon noir with volumetric light',
  'Studio Ghibli watercolor softness with warm palettes',
  'Moody chiaroscuro oil painting with textured brush strokes',
  'Retrofuturistic synthwave gradients with sharp rim lights',
  'Illustrated dark fantasy etching with metallic highlights',
  'High-contrast monochrome photography with subtle grain',
  '1970s cosmic pulp cover art with bold halftones',
  'Cyberpunk rain-soaked alley in anamorphic cinema lighting',
  'Minimalist mid-century modern collage with geometric blocks',
  'Baroque gilded canvas with dramatic drapery and candle glow',
  'Dreamy pastel vaporwave cityscape with mirrored reflections',
  'Ink-and-wash East Asian landscape with misty mountains',
  'Retro RPG pixel art with soft dithering and limited palette',
  'Noir graphic novel style with white ink on dark paper',
  'Vivid sci-fi concept art with lens flares and depth haze',
  'Surreal double exposure photography blending forest and faces'
] as const;

// --- TYPES ---
type Scene = z.infer<typeof AnySceneSchema> & { id: string; img?: string; };
type GameSession = {
  id: string;
  history: (Scene | { id: string; narration: string; status: 'ongoing' })[];
  params: { genre: string; ton: string; pov: string; cadre: string; };
  imageStyle?: string;
}
type GeminiImageResponse = {
  candidates?: Array<{ content?: { parts?: [{ inlineData?: { data: string } }] } }>;
};


// --- IN-MEMORY STORAGE & PERSISTENCE ---
let games = new Map<string, GameSession>();
const { TARGET_SCENES, CHALLENGE_SCENES, FINAL_SCENE } = STORY_CONFIG;

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

if (!GEMINI_API_KEY) {
  console.error("Erreur: La variable d'environnement GEMINI_API_KEY n'est pas définie.");
  console.error("Veuillez créer un fichier .env dans le dossier 'api' et y ajouter votre clé.");
  process.exit(1);
}

async function generateText<T extends z.ZodType>(prompt: string, schema: T, maxRetries = 2): Promise<z.infer<T>> {
  let lastError: unknown = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
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
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
      console.warn(`Attempt ${i + 1} failed: ${errorMessage}. Retrying...`);
      prompt = `${prompt}\n\nYour previous response was invalid. Please ensure your response is a valid JSON that strictly follows the requested schema. Error details: ${errorMessage}`;
    }
  }
  const finalErrorMessage = lastError instanceof Error ? lastError.message : JSON.stringify(lastError, null, 2);
  throw new Error(`Failed to get a valid response from Gemini after ${maxRetries} attempts. Last error: ${finalErrorMessage}`);
}

async function generateImage(prompt: string): Promise<string | undefined> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `Create a square illustration with a strict 1:1 aspect ratio at roughly 512x512 resolution, cinematic lighting, and clean framing. Avoid overlaid text or logos. Depict the following scene description (narrative in French, image language-agnostic): ${prompt}` },
            { text: 'Return a single part containing only the raw image data (no JSON).' }
          ]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini Image API Error:", response.status, errorText.slice(0, 500));
      return undefined;
    }

    const data = (await response.json()) as GeminiImageResponse;
    console.log('[generateImage] Full Gemini Response:', JSON.stringify(data, null, 2));
    const base64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64) {
      console.error("No image data found in Gemini's response. Full response logged above.");
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
const port = process.env.PORT || 8090;
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
    const imageStyle = IMAGE_STYLES[Math.floor(Math.random() * IMAGE_STYLES.length)];
    const gameParams = { genre, ton, pov, cadre };

    const challengeSummary = CHALLENGE_SCENES.map((step) => `scene ${step}`).join(' and ');
    const prologuePrompt = `You are an interactive storytelling AI. Write a French-language prologue for a ${TARGET_SCENES}-scene adventure (scenes 1-${FINAL_SCENE}). Scenes ${challengeSummary} will be challenge scenes, and scene ${FINAL_SCENE} must deliver the ending. Use the following parameters: genre=${genre}, tone=${ton}, point of view=${pov}, framing="${cadre}". Craft 2-4 French sentences that set the stage and stop immediately before the first decision. Return JSON only: { "narration": "<French text>" }.`;
    const prologueResult = await generateText(prologuePrompt, PrologueSchema);

    const firstChoicesPrompt = `Using the following French prologue: "${prologueResult.narration}", propose exactly three concise French options for the player's first decision. Return JSON: { "options": ["option 1", "option 2", "option 3"] }. All options must be in French.`;
    const OptionsSchema = z.object({ options: z.array(z.string()).length(3) });
    const firstChoicesResult = await generateText(firstChoicesPrompt, OptionsSchema);

    const sanitizedPrologue = prologueResult.narration.replace(/\s+/g, ' ').slice(0, 360);
    const imagePrompt = `${imageStyle}. Genre ${gameParams.genre}, tone ${gameParams.ton}. French scene summary: ${sanitizedPrologue}. POV ${gameParams.pov}.`;
    const imageUrl = await generateImage(imagePrompt);

    const firstScene: Scene = {
      id: crypto.randomUUID(),
      img: imageUrl,
      status: 'ongoing',
      narration: prologueResult.narration,
      options: firstChoicesResult.options,
    };

    const newGame: GameSession = {
      id: gameId,
      params: gameParams,
      history: [firstScene],
      imageStyle,
    };
    games.set(gameId, newGame);
    await saveGames();

    console.log('[POST /api/game] Sending first scene:', JSON.stringify(firstScene, null, 2));
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

        if (!game.imageStyle) {
            game.imageStyle = IMAGE_STYLES[Math.floor(Math.random() * IMAGE_STYLES.length)];
        }

        const scenesOnly = game.history.filter(entry => !entry.narration.startsWith('>'));
        const lastScene = scenesOnly[scenesOnly.length - 1];

        if (!lastScene) {
            return res.status(400).json({ error: 'No scene history available for this game.' });
        }

        if (lastScene.status !== 'ongoing' || scenesOnly.length >= FINAL_SCENE) {
            return res.status(400).json({ error: 'The story has already reached its conclusion.' });
        }

        const nextSceneIndex = scenesOnly.length + 1;
        const challengeSet = new Set<number>(CHALLENGE_SCENES as readonly number[]);
        const isChallengeScene = challengeSet.has(nextSceneIndex);
        const isFinalScene = nextSceneIndex === FINAL_SCENE;

        const userChoice = { id: crypto.randomUUID(), narration: `> ${choice}`, status: 'ongoing' as const };
        game.history.push(userChoice);

        const startIndex = Math.max(0, scenesOnly.length - 4);
        const recentScenes = scenesOnly.slice(startIndex).map((scene, idx) => ({
            scene: startIndex + idx + 1,
            narration: scene.narration,
            status: scene.status,
            challenge: 'challenge' in scene ? scene.challenge?.question : undefined,
            options: 'options' in scene ? scene.options : undefined,
        }));

        const challengeSummary = CHALLENGE_SCENES.map((step) => `scene ${step}`).join(' and ');
        const promptHeader = `You are an interactive storytelling AI. Continue a French-language adventure that is capped at ${TARGET_SCENES} scenes. Challenge scenes must occur at ${challengeSummary}. The finale happens at scene ${FINAL_SCENE} with status "win" or "loss".`;
        const contextBlock = JSON.stringify(recentScenes, null, 2);

        let outputInstruction: string;
        if (isFinalScene) {
            outputInstruction = `Scene ${nextSceneIndex} is the finale. Return JSON {"narration": "2-4 French sentences resolving the plot", "endingTitle": "Short French title", "status": "win"|"loss"}. Do NOT include options or a challenge.`;
        } else if (isChallengeScene) {
            outputInstruction = `Scene ${nextSceneIndex} is a challenge. Return JSON {"narration": "2-3 French sentences", "challenge": {"question": "French puzzle using previously introduced clues", "choices": ["choix A", "choix B", "choix C"]}, "status": "ongoing"}. Do NOT include options.`;
        } else {
            outputInstruction = `Scene ${nextSceneIndex} is a normal decision moment. Return JSON {"narration": "2-4 French sentences", "options": ["option 1", "option 2", "option 3"], "status": "ongoing"}.`;
        }

        const nextScenePrompt = `${promptHeader}

Story parameters: genre="${game.params.genre}", tone="${game.params.ton}", POV="${game.params.pov}", framing="${game.params.cadre}".

Recent French scenes (oldest to newest):
${contextBlock}

Latest player choice (French): "${choice}"
You must now produce scene ${nextSceneIndex} of ${TARGET_SCENES}.

${outputInstruction}

General rules:
- All narration, questions, options, and titles must be in French (<=120 words).
- Challenge questions must reference clues or elements already established.
- Do not end the story before scene ${FINAL_SCENE}.
- Return STRICT JSON with no commentary.`;

        const nextSceneResult = await generateText(nextScenePrompt, AnySceneSchema);

        if (isFinalScene && nextSceneResult.status === 'ongoing') {
            throw new Error(`Expected an ending at scene ${FINAL_SCENE}, but received status "ongoing".`);
        }

        const sceneSummary = nextSceneResult.narration.replace(/\s+/g, ' ').slice(0, 360);
        const imagePrompt = `${game.imageStyle}. Genre ${game.params.genre}, tone ${game.params.ton}. Upcoming French scene summary: ${sceneSummary}.`;
        const imageUrl = await generateImage(imagePrompt);

        const newScene: Scene = {
            id: crypto.randomUUID(),
            img: imageUrl,
            ...nextSceneResult
        };

        game.history.push(newScene);
        games.set(gameId, game);
        await saveGames();

        console.log(`[POST /api/game/${gameId}/choice] Sending new scene:`, JSON.stringify(newScene, null, 2));
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
