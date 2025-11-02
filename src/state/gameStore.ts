import { create } from 'zustand';
import { Scene, GameStartParams } from '../types';
import * as api from '../lib/api';

// Define the shape of the store's state
interface GameState {
  gameId: string | null;
  history: Scene[];
  activeSceneIndex: number;
  loading: boolean;
  error: string | null;
  prologue: string | null;
  showPrologue: boolean;
  started: boolean; // Add a simple flag to know if the game has started

  // Actions to manipulate the state
  startGame: (params: GameStartParams) => Promise<void>;
  makeChoice: (choice: string) => Promise<void>;
  answerChallenge: (answer: string, index: number) => Promise<void>;
  setShowPrologue: (show: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  gameId: null,
  history: [],
  activeSceneIndex: 0,
  loading: false,
  error: null,
  prologue: null,
  showPrologue: false,
  started: false,

  // --- ACTIONS ---

  startGame: async (params) => {
    set({ loading: true, error: null, started: true });
    try {
      const { gameId, prologue } = await api.startGame(params);
      set({
        gameId,
        prologue: prologue.narration,
        history: [prologue],
        activeSceneIndex: 0,
        showPrologue: true,
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

  setShowPrologue: (show) => {
    set({ showPrologue: show });
  },

  reset: () => {
    set({
      gameId: null,
      history: [],
      activeSceneIndex: 0,
      loading: false,
      error: null,
      prologue: null,
      showPrologue: false,
      started: false,
    });
  },
}));
