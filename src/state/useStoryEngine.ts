import { useState } from 'react';
import type { SceneNode, Settings } from '../types';
import { adventurePromptIntroStart, adventurePromptContinue } from '../lib/prompts';
import { callGemini, extractJson, generateImageWithGemini } from '../lib/gemini';
import { buildImagePrompt, imageUrlFromPrompt, deriveHeroDescriptor, deriveStylePreset } from '../lib/images';

export function useStoryEngine(initial: Settings) {
  // Réglages
  const [genre, setGenre] = useState(initial.genre);
  const [ton, setTon]     = useState(initial.ton);
  const [pov, setPov]     = useState<'je' | 'tu'>(initial.pov);
  const [cadre, setCadre] = useState(initial.cadre);

  // Flow
  const [started, setStarted]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string>('');
  const [prologue, setPrologue]   = useState<string>('');
  const [showPrologue, setShowPrologue] = useState<boolean>(false);

  // Aventure
  const [history, setHistory] = useState<SceneNode[]>([]);
  const active = history.length - 1;

  async function generateIntroAndFirstScene(settings: Settings) {
    const raw = await callGemini(adventurePromptIntroStart(settings));
    const parsed = extractJson(raw);
    if (!parsed || !parsed.scene || !Array.isArray(parsed.scene.options)) throw new Error('Réponse IA invalide (intro)');
    const narration: string = parsed.scene.narration;
    const imgPrompt = buildImagePrompt(narration, settings);
    let img = '';
    try { img = await generateImageWithGemini(imgPrompt); } catch { img = imageUrlFromPrompt(imgPrompt, narration); }
    return {
      prologue: parsed.prologue,
      first: {
        id: crypto.randomUUID(),
        narration,
        options: parsed.scene.options.slice(0,3),
        img,
        status: parsed.scene.status,
        endingTitle: parsed.scene.endingTitle,
        challenge: undefined
      } as SceneNode
    };
  }

  async function generateNextScene(choice: string, settings: Settings) {
    const raw = await callGemini(adventurePromptContinue(history, choice));
    const parsed = extractJson(raw);
    const narration: string = parsed.narration;
    const imgPrompt = buildImagePrompt(narration, settings);
    let img = '';
    try { img = await generateImageWithGemini(imgPrompt); } catch { img = imageUrlFromPrompt(imgPrompt, narration); }
    const node: SceneNode = {
      id: crypto.randomUUID(),
      narration,
      options: Array.isArray(parsed.options) ? parsed.options.slice(0, 3) : [],
      img,
      status: parsed.status || 'ongoing',
      endingTitle: parsed.endingTitle,
      challenge: parsed.challenge ? {
        question: String(parsed.challenge.question || ''),
        choices: Array.isArray(parsed.challenge.choices) ? parsed.challenge.choices.slice(0,3) : [],
        answerIndex: typeof parsed.challenge.answerIndex === 'number' ? parsed.challenge.answerIndex : 0,
      } : undefined,
    };
    return node;
  }

  // Actions
  async function startGame() {
    setStarted(true);
    setLoading(true); setError('');
    try {
      const hero  = deriveHeroDescriptor({ genre, ton, pov, cadre });
      const style = deriveStylePreset(genre);
      try { localStorage.setItem('sr_hero', hero); localStorage.setItem('sr_style', style); localStorage.setItem('sr_seed', `${hero}|${style}`); } catch {}
      const { prologue, first } = await generateIntroAndFirstScene({ genre, ton, pov, cadre });
      setPrologue(prologue);
      setHistory([first]);
      setShowPrologue(true);
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  async function pickOption(opt: string) {
    setLoading(true); setError('');
    try {
      const next = await generateNextScene(opt, { genre, ton, pov, cadre });
      setHistory(prev => [...prev, next]);
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  async function answerChallenge(choiceLabel: string, choiceIndex: number) {
    const scene = history[active];
    if (!scene?.challenge) return;
    const correct = choiceIndex === scene.challenge.answerIndex;
    setLoading(true); setError('');
    try {
      const next = await generateNextScene(`[Épreuve ${active + 1}] réponse: "${choiceLabel}" (correct=${correct})`, { genre, ton, pov, cadre });
      setHistory(prev => [...prev, next]);
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStarted(false);
    setHistory([]);
    setError('');
    setShowPrologue(false);
    setPrologue('');
  }

  return {
    // state
    genre, ton, pov, cadre,
    setGenre, setTon, setPov, setCadre,
    started, loading, error,
    prologue, showPrologue, setShowPrologue,
    history, active,
    // actions
    startGame, pickOption, answerChallenge, reset,
  };
}