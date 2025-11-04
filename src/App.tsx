
import { AnimatePresence, motion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';
import LoadingGlyph from './components/LoadingGlyph';
import MagicButton from './components/MagicButton';
import WordCloud from './components/WordCloud';
import MagicCursor from './components/MagicCursor';
import { useGameStore } from './state/gameStore';
import { page, rightPane, topbar, bottombar, card, btn, contentWrap } from './styles/ui';

const cardVariants: Variants = {
  initial: { opacity: 0, y: 40, scale: 0.95, rotateX: 8, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -40, scale: 0.96, rotateX: -6, filter: 'blur(8px)' },
};
const cardTransition: Transition = { type: 'spring', stiffness: 120, damping: 18, mass: 0.9 };

export default function App() {
  // Zustand store for all game-related state
  const {
    started, loading, error,
    history, activeSceneIndex,
    startGame, makeChoice, answerChallenge, goBack, reset,
  } = useGameStore();

  const activeScene = history[activeSceneIndex];

  const handleStartGame = (words: string[]) => {
    // Les mots choisis par l'utilisateur deviennent le cadre de l'histoire.
    // Le genre et le ton peuvent être fixés ou dérivés plus tard.
    const storyPrompt = `Une histoire basée sur les concepts suivants : ${words.join(', ')}.`;
    startGame({
      genre: 'Création du joueur',
      ton: 'Inattendu',
      pov: 'tu',
      cadre: storyPrompt,
    });
  };

  return (
    <>
    <MagicCursor />
    <div style={page}>
        <div style={rightPane}>
          <div style={topbar}>
            <div>HuntChapter</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {started && (
                <button
                  style={{ ...btn, padding: '6px 10px' }}
                  onClick={reset}
                >
                  ↺ Recommencer
                </button>
              )}
            </div>
          </div>

        <div style={contentWrap}>
        <div style={{ position: 'relative', flex: 1, display: 'grid', placeItems: 'center' }}>
          <AnimatePresence mode="wait">
            {!started ? (
              <motion.div key="intro" variants={cardVariants} initial="initial" animate="animate" exit="exit" transition={cardTransition} style={{ ...card, width: '100%', maxWidth: '800px', transformPerspective: 1000 }}>
                <WordCloud onSubmit={handleStartGame} loading={loading} />
                {error && <p style={{ color: '#ffb3b3', textAlign: 'center' }}>⚠️ {error}</p>}
              </motion.div>
            ) : (
              <motion.div key={activeScene?.id || 'scene'} variants={cardVariants} initial="initial" animate="animate" exit="exit" transition={cardTransition} style={{ ...card, transformPerspective: 1000 }}>
                {activeScene?.img && (
                  <div style={{ aspectRatio: '1 / 1', background: '#0b0b0f', borderRadius: 12, overflow: 'hidden', marginBottom: 12, border: '1px solid #1c2230', maxHeight: '30vh', width: '100%' }}>
                    <img src={activeScene.img} alt="Illustration de la scène" style={{ width: 'auto', height: '100%', objectFit: 'cover', display: 'block', margin: '0 auto' }} />
                  </div>
                )}
                {loading ? (
                  <>
                    <LoadingGlyph />
                    <p style={{ opacity: 0.8, textAlign: 'center', margin: 0 }}>Le destin se tisse…</p>
                  </>
                ) : (
                  <>
                    {activeScene?.challenge ? (
                      <>
                        <div style={{ marginBottom: 10, whiteSpace: 'pre-wrap', lineHeight: 1.75, fontWeight: 600 }}>{activeScene.narration}</div>
                        <h3 style={{ margin: '8px 0 6px 0' }}>Épreuve</h3>
                        <p style={{ marginTop: 0, marginBottom: 10, opacity: 0.9 }}>{activeScene.challenge.question}</p>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {activeScene.challenge.choices.map((label, idx) => (
                            <MagicButton key={idx} onClick={() => answerChallenge(label, idx)}>{label}</MagicButton>
                          ))}
                        </div>
                      </>
                    ) : ((activeScene?.status && activeScene.status !== 'ongoing') || (activeScene?.options?.length ?? 0) === 0) ? (
                      <>
                        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Épilogue{activeScene?.endingTitle ? ` — ${activeScene.endingTitle}` : ''}</h3>
                        <div style={{ marginBottom: 10, whiteSpace: 'pre-wrap', lineHeight: 1.75, fontWeight: 600 }}>{activeScene?.narration}</div>
                      </>
                    ) : (
                      <>
                        <div style={{ marginBottom: 10, whiteSpace: 'pre-wrap', lineHeight: 1.75, fontWeight: 600 }}>{activeScene?.narration}</div>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {activeScene?.options?.map((opt, i) => (
                            <MagicButton key={i} onClick={() => makeChoice(opt)}>{opt}</MagicButton>
                          ))}
                        </div>
                      </>
                    )}
                     <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                       <button style={btn} onClick={goBack} disabled={activeSceneIndex === 0}>← Précédent</button>
                    </div>
                    {error && <p style={{ color: '#ffb3b3' }}>⚠️ {error}</p>}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={bottombar}>
         
        </div>
        </div>
      </div>
    </div>
    </>
  );
}
