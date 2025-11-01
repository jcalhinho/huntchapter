import type { Settings } from '../types';

export function hashSeed(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 100000;
}

export function deriveHeroDescriptor(settings: Settings) {
  const base = `${settings.genre}|${settings.ton}|${settings.cadre}|${settings.pov}`;
  const seed = hashSeed(base);
  const looks = ['cheveux noirs courts', 'cheveux bruns ondulés', 'cheveux argentés', 'crâne rasé', 'queue-de-cheval sombre'];
  const gear  = ['combinaison tactique', 'manteau long', 'armure légère', 'tenue d’exploration', 'veste usée'];
  const accent= ['cicatrice discrète', 'tatouage fin', 'masque respirateur', 'lunettes transparentes', 'gants renforcés'];
  const pick = (arr: string[], s: number) => arr[s % arr.length];
  return `même protagoniste, ${pick(looks, seed)} , ${pick(gear, seed>>3)}, ${pick(accent, seed>>5)}, expression déterminée`;
}

export function deriveStylePreset(genre: string) {
  const map: Record<string, string> = {
    'Science-fiction': 'digital painting, concept art spatial, couleurs froides bleu/violet, nébuleuses, lumière cinématographique',
    'Fantasy':         'digital painting, concept art épique, palette émeraude/or, lumière cinématographique',
    'Enquête':         'digital painting, film noir moderne, contraste élevé, ambiance brumeuse',
    'Survie':          'digital painting, palette désaturée, grain léger, éclairage dramatique',
    'Historique':      'digital painting, textures fines, tons chauds, lumière naturelle',
  };
  return map[genre] || 'digital painting, concept art, lumière cinématographique';
}

export function buildImagePrompt(narration: string, settings: Settings) {
  const clean = narration.replace(/\n+/g, ' ').replace(/\s+/g, ' ').slice(0, 280);
  const hero  = (typeof localStorage !== 'undefined' && localStorage.getItem('sr_hero'))  || deriveHeroDescriptor(settings);
  const style = (typeof localStorage !== 'undefined' && localStorage.getItem('sr_style')) || deriveStylePreset(settings.genre);
  return [
    style,
    `${settings.cadre}, ambiance ${settings.ton.toLowerCase()}`,
    `toujours le même personnage: ${hero}`,
    `scène: ${clean}`,
    'no text, no caption, no letters, no logo, no watermark, SFW',
  ].join(', ');
}

export function imageUrlFromPrompt(prompt: string, seedHint: string) {
  const provider  = (import.meta as any).env?.VITE_IMAGE_PROVIDER || 'pollinations';
  const persisted = (typeof localStorage !== 'undefined' && localStorage.getItem('sr_seed')) || seedHint;
  const seed = hashSeed(persisted);
  if (provider.toLowerCase() === 'pollinations') {
    const q = encodeURIComponent(prompt + ', 4k, highly detailed');
    const w = 960, h = 540;
    return `https://image.pollinations.ai/prompt/${q}?width=${w}&height=${h}&seed=${seed}`;
  }
  // Fallback SVG
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 540'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='%231d2540' offset='0'/><stop stop-color='%23182034' offset='1'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/></svg>`
  )}`;
}