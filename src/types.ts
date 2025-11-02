// Represents a single scene in the story, as defined by the backend.
export interface Scene {
  id: string;
  narration: string;
  options?: string[];
  challenge?: {
    question: string;
    choices: string[];
  };
  img?: string;
  status?: 'ongoing' | 'win' | 'loss';
  endingTitle?: string;
}

// Parameters required to start a new game.
export interface GameStartParams {
  genre: string;
  ton: string;
  pov: string;
  cadre: string;
}

// The response from the backend when a new game is started.
export interface GameStartResponse {
  gameId: string;
  prologue: Scene;
}

// The response from the backend after a player makes a choice.
export type NewSceneResponse = Scene;
