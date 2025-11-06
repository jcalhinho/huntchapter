import type { SceneNode, Settings } from '../types';
import { STORY_CONFIG } from '../types';

const { TARGET_SCENES, CHALLENGE_STEPS, FINAL_SCENE } = STORY_CONFIG;

export function adventurePromptIntroStart(settings: Settings) {
  const challenges = CHALLENGE_STEPS.map((step) => `scene ${step}`).join(' and ');
  return `You are an interactive storyteller AI. Plan a French-language adventure for exactly ${TARGET_SCENES} scenes (scenes 1–${FINAL_SCENE}). Scenes ${challenges} are mandatory challenge scenes and scene ${FINAL_SCENE} is the ending.

Write a French prologue that sets the tone (genre: ${settings.genre}, tone: ${settings.ton}, POV: ${settings.pov}) and transitions naturally into the first decision.

Respond with JSON only:
{ "narration": "Prologue français en 4-6 phrases (150-220 mots) se terminant juste avant la première décision." }

All narrative content must be in French, even though these instructions are in English.`;
}

export function adventurePromptContinue(history: SceneNode[], choice: string, settings: Settings) {
  const start = Math.max(0, history.length - 4);
  const conciseHistory = history.slice(start).map((scene, index) => ({
    scene: start + index + 1,
    narration: scene.narration,
    challenge: scene.challenge ? scene.challenge.question : undefined,
    status: scene.status,
  }));
  const upcomingScene = history.length + 1;
  const challenges = CHALLENGE_STEPS.join(', ');

  return `You are an interactive storyteller AI. Continue a French-language narrative capped at ${TARGET_SCENES} scenes. Scenes ${challenges} must be challenge scenes. Scene ${FINAL_SCENE} must conclude the story with status "win" or "loss".

Story parameters: genre=${settings.genre}, tone=${settings.ton}, POV=${settings.pov}, framing=${settings.cadre}.

Recent French scenes:
${JSON.stringify(conciseHistory)}

Last player choice (French): ${choice}
Upcoming scene index: ${upcomingScene} of ${TARGET_SCENES}

Rules:
- Produce French text only (narration, questions, options).
- If scene ${upcomingScene} is a challenge scene (${challenges}), return JSON:
  { "narration": "4-6 phrases en français (120-200 mots)", "challenge": { "question": "Énigme française basée sur les indices précédents", "choices": ["...", "...", "..."] }, "status": "ongoing" }
- If scene ${upcomingScene} < ${FINAL_SCENE} and not a challenge, return JSON:
  { "narration": "4-6 phrases françaises (120-200 mots)", "options": ["option 1", "option 2", "option 3"], "status": "ongoing" }
- If scene ${upcomingScene} === ${FINAL_SCENE}, return JSON:
  { "narration": "Résolution française en 4-6 phrases (150-230 mots)", "endingTitle": "Titre court en français", "status": "win"|"loss" }
- Do not return options or a challenge in the ending.

Return JSON strictly, no commentary.`;
}
