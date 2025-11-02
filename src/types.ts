// This file was missing the `export` keyword, causing build failures.
// All types used across the frontend should be explicitly exported.

/**
 * Represents a single scene in the story, as defined by the backend.
 * This corresponds to the `AnySceneSchema` from the backend.
 */
export interface Scene {
  id: string;
  narration: string;
  options?: string[];
  challenge?: {
    question: string;
    choices: string[];
  };
  img?: string;
  status: 'ongoing' | 'win' | 'loss';
  endingTitle?: string;
}

/**
 * Parameters required to start a new game.
 * Sent from the frontend to the backend.
 */
export interface GameStartParams {
  genre: string;
  ton: string;
  pov: string;
  cadre: string;
}

/**
 * The response from the backend when a new game is started.
 */
export interface GameStartResponse {
  gameId: string;
  prologue: Scene;
}

/**
 * The response from the backend after a player makes a choice.
 */
export type NewSceneResponse = Scene;
