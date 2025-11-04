import { adventurePromptIntroStart, adventurePromptContinue } from './prompts';
import { extractJson } from './gemini';
import { buildImagePrompt, imageUrlFromPrompt } from './images';
import type { GameStartParams, Scene } from '../types';

const LOCAL_MODEL_NAME = 'gemini-nano';
const DEFAULT_TIMEOUT_MS = 5000;
type LocalTextSession = {
  prompt: (input: string) => Promise<string>;
};

let sessionPromise: Promise<LocalTextSession> | null = null;

export class LocalModelUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalModelUnavailableError';
  }
}

export class LocalModelResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalModelResponseError';
  }
}

function hasNavigatorAI(): boolean {
  return typeof navigator !== 'undefined' && typeof (navigator as any).ai !== 'undefined';
}

async function createSession(): Promise<LocalTextSession> {
  if (!hasNavigatorAI()) {
    throw new LocalModelUnavailableError('navigator.ai indisponible dans cet environnement.');
  }

  const ai = (navigator as any).ai;

  if (typeof ai.canCreateTextSession === 'function') {
    const availability = await ai.canCreateTextSession({ model: LOCAL_MODEL_NAME });
    if (availability === 'no') {
      throw new LocalModelUnavailableError('Gemini Nano non disponible ou désactivé.');
    }
  }

  if (typeof ai.createTextSession !== 'function') {
    throw new LocalModelUnavailableError('API navigator.ai.createTextSession absente.');
  }

  const session = await ai.createTextSession({
    model: LOCAL_MODEL_NAME,
    temperature: 0.7,
  });

  if (!session || typeof session.prompt !== 'function') {
    throw new LocalModelUnavailableError('Session texte locale invalide.');
  }

  return session as LocalTextSession;
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new LocalModelResponseError(errorMessage));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function ensureSession(): Promise<LocalTextSession> {
  if (!sessionPromise) {
    sessionPromise = createSession();
  }
  return sessionPromise;
}

async function runPrompt(prompt: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string> {
  const session = await ensureSession();
  try {
    const response = await withTimeout(
      session.prompt(`${prompt}\n\nRéponds uniquement avec un objet JSON valide.`),
      timeoutMs,
      'Délai dépassé lors de la génération locale.',
    );
    if (typeof response !== 'string' || response.trim() === '') {
      throw new LocalModelResponseError('Réponse vide du modèle local.');
    }
    return response;
  } catch (error) {
    sessionPromise = null; // force un nouveau chargement la prochaine fois
    throw error instanceof Error ? error : new LocalModelResponseError('Erreur inconnue du modèle local.');
  }
}

async function promptForJson(prompt: string, retries = 1): Promise<any> {
  let lastError: Error | null = null;
  let currentPrompt = prompt;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const raw = await runPrompt(currentPrompt, DEFAULT_TIMEOUT_MS + attempt * 1500);
      const parsed = extractJson(raw);
      if (parsed) {
        return parsed;
      }
      lastError = new LocalModelResponseError('Réponse locale sans JSON exploitable.');
      currentPrompt = `${prompt}\n\nIMPORTANT : fournis uniquement un JSON conforme à la structure demandée, sans texte supplémentaire.`;
    } catch (err) {
      lastError = err instanceof Error ? err : new LocalModelResponseError('Erreur locale inattendue.');
    }
  }

  throw lastError ?? new LocalModelResponseError('Impossible de récupérer une réponse JSON valide.');
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildUserChoiceScene(choice: string): Scene {
  return {
    id: generateId('choice'),
    narration: `> ${choice}`,
    status: 'ongoing',
  };
}

function ensureImage(narration: string, params: GameStartParams): string | undefined {
  try {
    const prompt = buildImagePrompt(narration, params);
    return imageUrlFromPrompt(prompt, narration);
  } catch (error) {
    console.warn('[localStoryEngine] Image fallback indisponible:', error);
    return undefined;
  }
}

function filterScenes(history: Scene[]): Scene[] {
  return history.filter((entry) => !entry.narration.startsWith('>'));
}

export async function startLocalGame(params: GameStartParams): Promise<{ history: Scene[] }> {
  const prologueData = await promptForJson(adventurePromptIntroStart(params), 1);
  const narration = String(prologueData?.narration ?? '').trim();
  if (!narration) {
    throw new LocalModelResponseError('Le modèle local a retourné un prologue vide.');
  }

  const choicesPrompt = `En utilisant le prologue français suivant: "${narration}", propose exactement trois options concises en français pour la première décision du joueur. Retourne uniquement un JSON de la forme { "options": ["option 1", "option 2", "option 3"] }.`;
  const optionsData = await promptForJson(choicesPrompt, 1);

  if (!Array.isArray(optionsData?.options) || optionsData.options.length !== 3) {
    throw new LocalModelResponseError('Le modèle local n’a pas fourni 3 options valides.');
  }

  const options = optionsData.options.map((opt: unknown) => String(opt).trim());

  const firstScene: Scene = {
    id: generateId('scene'),
    narration,
    status: 'ongoing',
    options,
    img: ensureImage(narration, params),
  };

  return {
    history: [firstScene],
  };
}

export async function continueLocalGame(history: Scene[], choice: string, params: GameStartParams): Promise<{ scene: Scene }> {
  const trimmedChoice = choice.trim();
  if (!trimmedChoice) {
    throw new LocalModelResponseError('Le choix du joueur est vide.');
  }
  const scenesOnly = filterScenes(history);
  const prompt = adventurePromptContinue(scenesOnly, trimmedChoice, params);
  const nextSceneData = await promptForJson(prompt, 1);

  const narration = String(nextSceneData?.narration ?? '').trim();
  if (!narration) {
    throw new LocalModelResponseError('La scène générée localement est vide.');
  }

  const status = nextSceneData?.status;
  if (status !== 'ongoing' && status !== 'win' && status !== 'loss') {
    throw new LocalModelResponseError('Statut de scène local invalide.');
  }

  const scene: Scene = {
    id: generateId('scene'),
    narration,
    status,
    img: ensureImage(narration, params),
  };

  if (nextSceneData?.challenge) {
    const { question, choices } = nextSceneData.challenge;
    if (!Array.isArray(choices) || choices.length === 0) {
      throw new LocalModelResponseError('Défi local invalide (choices manquants).');
    }
    scene.challenge = {
      question: String(question ?? '').trim(),
      choices: choices.map((opt: unknown) => String(opt).trim()),
    };
  }

  if (Array.isArray(nextSceneData?.options)) {
    scene.options = nextSceneData.options.map((opt: unknown) => String(opt).trim());
  }

  if (typeof nextSceneData?.endingTitle === 'string') {
    scene.endingTitle = nextSceneData.endingTitle.trim();
  }

  return { scene };
}

export function buildChoiceMarker(choice: string): Scene {
  return buildUserChoiceScene(choice);
}

export function resetLocalModelSession() {
  sessionPromise = null;
}
