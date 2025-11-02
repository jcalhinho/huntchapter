import { create } from 'zustand';
import type { Scene, GameStartParams } from '../types';
import * as api from '../lib/api';

// Define the shape of the store's state
interface GameState {
  gameId: string | null;
  history: Scene[];
  activeSceneIndex: number;
  loading: boolean;
  error: string | null;
  started: boolean; // Add a simple flag to know if the game has started

  // Actions to manipulate the state
  startGame: (params: GameStartParams) => Promise<void>;
  makeChoice: (choice: string) => Promise<void>;
  answerChallenge: (answer: string, index: number) => Promise<void>;
  goBack: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  gameId: null,
  history: [],
  activeSceneIndex: 0,
  loading: false,
  error: null,
  started: false,

  // --- ACTIONS ---

  startGame: async (params) => {
    set({ loading: true, error: null, started: true });
    try {
      const { gameId, prologue } = await api.startGame(params);
      set({
        gameId,
        history: [prologue],
        activeSceneIndex: 0,
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false, started: false });
    }
  },

  makeChoice: async (choice) => {
    const gameId = get().gameId;
    if (!gameId || get().loading) return;

    set({ loading: true, error: null });

    // Optimistically add user choice to history
    const userChoice = { id: `user-${Date.now()}`, narration: `> ${choice}` };
    set(state => ({ history: [...state.history, userChoice]}));


    try {
      const newScene = await api.makeChoice(gameId, choice);
      set((state) => ({
        history: [...state.history, newScene],
        activeSceneIndex: state.history.length,
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  answerChallenge: async (answer, index) => {
      await get().makeChoice(answer);
  },

  goBack: () => {
    set(state => ({
      activeSceneIndex: Math.max(0, state.activeSceneIndex - 1)
    }));
  },

  reset: () => {
    set({
      gameId: null,
      history: [],
      activeSceneIndex: 0,
      loading: false,
      error: null,
      started: false,
    });
  },
}));
