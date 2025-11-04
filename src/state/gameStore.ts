import { create } from 'zustand';
import type { Scene, GameStartParams } from '../types';
import * as api from '../lib/api';
import {
  startLocalGame,
  continueLocalGame,
  buildChoiceMarker,
  resetLocalModelSession,
  LocalModelUnavailableError,
  LocalModelResponseError,
} from '../lib/localStoryEngine';

type GameMode = 'idle' | 'local' | 'remote';

const isUserChoice = (entry: Scene) => entry.narration.startsWith('>');

function extractChoices(history: Scene[]): string[] {
  return history
    .filter(isUserChoice)
    .map((entry) => entry.narration.slice(2).trim())
    .filter(Boolean);
}

async function rebuildRemoteFromHistory(params: GameStartParams, choices: string[]) {
  const { gameId, prologue } = await api.startGame(params);
  const rebuiltHistory: Scene[] = [prologue];

  for (const choice of choices) {
    rebuiltHistory.push(buildChoiceMarker(choice));
    const scene = await api.makeChoice(gameId, choice);
    rebuiltHistory.push(scene);
  }

  return { gameId, history: rebuiltHistory };
}

// Define the shape of the store's state
interface GameState {
  gameId: string | null;
  history: Scene[];
  activeSceneIndex: number;
  loading: boolean;
  error: string | null;
  started: boolean;
  mode: GameMode;
  params: GameStartParams | null;

  // Actions to manipulate the state
  startGame: (params: GameStartParams) => Promise<void>;
  makeChoice: (choice: string) => Promise<void>;
  answerChallenge: (answer: string, index: number) => Promise<void>;
  goBack: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  gameId: null,
  history: [],
  activeSceneIndex: 0,
  loading: false,
  error: null,
  started: false,
  mode: 'idle',
  params: null,

  // --- ACTIONS ---

  startGame: async (params) => {
    set({
      loading: true,
      error: null,
      started: true,
      params,
      mode: 'idle',
      history: [],
      activeSceneIndex: 0,
      gameId: null,
    });

    try {
      const localResult = await startLocalGame(params);
      set({
        gameId: 'local',
        history: localResult.history,
        activeSceneIndex: localResult.history.length - 1,
        loading: false,
        error: null,
        mode: 'local',
      });
    } catch (localError) {
      if (!(localError instanceof LocalModelUnavailableError) && !(localError instanceof LocalModelResponseError)) {
        console.warn('[gameStore] Local model failure:', localError);
      }

      try {
        const { gameId, prologue } = await api.startGame(params);
        set({
          gameId,
          history: [prologue],
          activeSceneIndex: 0,
          loading: false,
          error: null,
          mode: 'remote',
        });
      } catch (err) {
        set({
          error: (err as Error).message,
          loading: false,
          started: false,
          mode: 'idle',
          params: null,
          history: [],
          activeSceneIndex: 0,
          gameId: null,
        });
      }
    }
  },

  makeChoice: async (choice) => {
    const state = get();
    if (state.loading || !state.started) {
      return;
    }

    const trimmedChoice = choice.trim();
    if (!trimmedChoice) {
      return;
    }

    if (state.mode === 'local') {
      if (!state.params) {
        return;
      }

      const previousHistory = state.history.slice();
      const previousIndex = state.activeSceneIndex;

      set({ loading: true, error: null });
      set((current) => ({
        history: [...current.history, buildChoiceMarker(trimmedChoice)],
      }));

      try {
        const { scene } = await continueLocalGame(previousHistory, trimmedChoice, state.params);
        set((current) => {
          const newHistory = [...current.history, scene];
          return {
            history: newHistory,
            activeSceneIndex: newHistory.length - 1,
            loading: false,
            error: null,
          };
        });
      } catch (err) {
        resetLocalModelSession();
        console.warn('[gameStore] Local continuation failed, attempting cloud fallback:', err);

        set({
          history: previousHistory,
          activeSceneIndex: previousIndex,
        });

        try {
          set({ loading: true });
          const fallbackChoices = [...extractChoices(previousHistory), trimmedChoice];
          const remote = await rebuildRemoteFromHistory(state.params, fallbackChoices);
          set({
            mode: 'remote',
            gameId: remote.gameId,
            history: remote.history,
            activeSceneIndex: remote.history.length - 1,
            loading: false,
            error: null,
          });
        } catch (remoteError) {
          set({
            error: (remoteError as Error).message,
            loading: false,
            started: false,
            mode: 'idle',
            params: null,
            history: [],
            activeSceneIndex: 0,
            gameId: null,
          });
        }
      }
      return;
    }

    if (state.mode === 'remote') {
      if (!state.gameId) return;

      const previousHistory = state.history.slice();
      const previousIndex = state.activeSceneIndex;

      set({ loading: true, error: null });
      set((current) => ({
        history: [...current.history, buildChoiceMarker(trimmedChoice)],
      }));

      try {
        const newScene = await api.makeChoice(state.gameId!, trimmedChoice);
        set((current) => {
          const newHistory = [...current.history, newScene];
          return {
            history: newHistory,
            activeSceneIndex: newHistory.length - 1,
            loading: false,
            error: null,
          };
        });
      } catch (err) {
        set({
          history: previousHistory,
          activeSceneIndex: previousIndex,
          loading: false,
          error: (err as Error).message,
        });
      }
    }
  },

  answerChallenge: async (answer, index) => {
    await get().makeChoice(answer);
  },

  goBack: () => {
    set((state) => {
      if (state.activeSceneIndex <= 0) {
        return {};
      }
      // We want to go back to the previous *scene*, skipping the user's choice.
      // The history looks like [..., Scene, UserChoice, CurrentScene].
      // So we need to find the index of the last scene that is not a user choice.
      const previousSceneIndex = state.history.findLastIndex(
        (scene, index) => index < state.activeSceneIndex && !scene.narration.startsWith('>')
      );

      return {
        activeSceneIndex: previousSceneIndex !== -1 ? previousSceneIndex : 0,
      };
    });
  },

  reset: () => {
    resetLocalModelSession();
    set({
      gameId: null,
      history: [],
      activeSceneIndex: 0,
      loading: false,
      error: null,
      started: false,
      mode: 'idle',
      params: null,
    });
  },
}));
