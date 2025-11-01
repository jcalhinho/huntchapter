import type { SceneNode, Settings } from '../types';
import { TARGET_SCENES, CHALLENGE_STEPS } from '../types';

export function adventurePromptIntroStart(settings: Settings) {
  return `Tu es un Maître de Jeu IA. Génère un PROLOGUE puis la PREMIÈRE SCÈNE.

Objectif: aventure d'environ ${TARGET_SCENES} scènes avec épreuves aux scènes ${CHALLENGE_STEPS.join(', ')}. La première scène n'est **pas** une épreuve.

Réponds STRICTEMENT en JSON sans commentaire :
{
  "prologue": string (2 à 4 phrases, contexte du monde et de la mission),
  "scene": {
    "narration": string (2 à 5 phrases, <= 120 mots, en "${settings.pov}"),
    "options": [ string, string, string ],
    "status": "ongoing"
  }
}
Contraintes: français, SFW, sans contenu choquant. Commence in medias res pour la scène.`;
}

export function adventurePromptContinue(history: SceneNode[], choice: string) {
  const context = history.slice(-5).map((h, i) => ({
    step: history.length - 5 + i + 1,
    narration: h.narration,
    options: h.options,
    status: h.status || 'ongoing',
    challenge: h.challenge ? { question: h.challenge.question, choices: h.challenge.choices } : undefined,
  })).filter(Boolean);
  const sceneIndex = history.length + 1;
  const maxScenes = TARGET_SCENES;
  const challengeSteps = CHALLENGE_STEPS.join(', ');
  return `Tu es un Maître de Jeu IA. Poursuis l'aventure **structurée**.

Contexte (5 dernières scènes max):
${JSON.stringify(context)}

Entrée joueur: ${choice}
Scène courante: ${sceneIndex} / ${maxScenes}

Règles NARRATIVES:
- L'histoire vise ~${maxScenes} scènes.
- Les scènes ${challengeSteps} sont des **épreuves**:
  • Basées sur des éléments **introduits auparavant** (noms, indices, sigles, motifs, codes)
  • OU un **détail visuel** à repérer dans l'image
  • OU une **mini-énigme logique** liée à l'intrigue.
- À la **dernière épreuve (${CHALLENGE_STEPS[CHALLENGE_STEPS.length-1]})**, prépare la **résolution**.
- Termine l'histoire si le climax est atteint OU si scène >= ${maxScenes}.

FORMAT DE SORTIE (JSON strict, sans commentaire) — choisis **exactement un** des deux schémas :
1) Scène classique (si pas une épreuve):
{ "narration": string (2–5 phrases, <=120 mots), "options": [ string, string, string ], "status": "ongoing" }
2) Scène d'épreuve (si scèneIndex ∈ {${challengeSteps}}):
{ "narration": string (2–4 phrases, <=100 mots), "options": [], "status": "ongoing",
  "challenge": { "question": string, "choices": [ string, string, string ], "answerIndex": 0|1|2 }
}

SI l'histoire DOIT FINIR (après la réponse à la dernière épreuve) :
{ "narration": string (2–5 phrases), "options": [], "status": "success"|"failure"|"end", "endingTitle"?: string }

Interdit: texte incrusté dans l'image, contenus non SFW. Langue: français.`;
}