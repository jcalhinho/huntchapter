// Types & constantes

export type Challenge = {
  question: string;
  choices: string[];
  answerIndex: number;
};

export type SceneNode = {
  id: string;
  narration: string;
  options: string[];
  img?: string;
  status?: 'ongoing' | 'success' | 'failure' | 'end';
  endingTitle?: string;
  challenge?: Challenge;
};

export type Settings = {
  genre: string;
  ton: string;
  pov: 'je' | 'tu';
  cadre: string;
};

export const TARGET_SCENES = 20;
export const CHALLENGE_STEPS = [5, 10, 15, 20];