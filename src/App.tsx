import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import LoadingGlyph from './components/LoadingGlyph';
import MagicButton from './components/MagicButton';
import Field from './components/Field';
import Options from './components/Options';
import { useGameStore } from './state/gameStore';
import { page, rightPane, topbar, bottombar, card, btn, btnPrimary } from './styles/ui';

const cardVariants = {
  initial: { opacity: 0, y: 40, scale: 0.95, rotateX: 8, filter: 'blur(8px)' as any },
  animate: { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' as any },
  exit:    { opacity: 0, y: -40, scale: 0.96, rotateX: -6, filter: 'blur(8px)' as any },
};
const cardTransition: Transition = { type: 'spring', stiffness: 120, damping: 18, mass: 0.9 };

export default function App() {
  // Local state for setup screen, not needed in global store
  const [genre, setGenre] = useState('Fantasy');
  const [ton, setTon] = useState('Épique');
  const [pov, setPov] = useState<'je' | 'tu'>('tu');
  const [cadre, setCadre] = useState('Monde original');

  // Zustand store for all game-related state
  const {
    started, loading, error, prologue, showPrologue, setShowPrologue,
    history, activeSceneIndex,
    startGame, makeChoice, answerChallenge, reset,
  } = useGameStore();

  const activeScene = history[activeSceneIndex];

  const handleStartGame = () => {
    startGame({ genre, ton, pov, cadre });
  };

  return (
    <div style={page}>
      <div style={rightPane}>
        <div style={topbar}>
          <div>StoryRunner</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>IA Adventure · Framer Motion</div>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'grid', placeItems: 'center' }}>
          <AnimatePresence mode="wait">
            {!started ? (
              <motion.div key="intro" variants={cardVariants} initial="initial" animate="animate" exit="exit" transition={cardTransition} style={{ ...card, transformPerspective: 1000 }}>
                <h2 style={{ margin: '0 0 8px 0' }}>Un jeu dont tu es le héros</h2>
                <p style={{ opacity: 0.85, marginTop: 0 }}>Choisis 4 paramètres… puis l’IA lance l’aventure. Que des boutons, aucune saisie.</p>
                <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                  <Field label="Genre"><Options current={genre} setCurrent={setGenre} items={['Fantasy','Science-fiction','Enquête','Survie','Historique']} /></Field>
                  <Field label="Ton"><Options current={ton} setCurrent={setTon} items={['Épique','Sombre','Léger','Mystérieux']} /></Field>
                  <Field label="Point de vue"><Options current={pov} setCurrent={setPov} items={['tu','je']} /></Field>
                  <Field label="Cadre"><Options current={cadre} setCurrent={setCadre} items={['Monde original','Ville moderne','Espace lointain','Médiéval','Post-apo']} /></Field>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button style={btnPrimary} onClick={handleStartGame} disabled={loading}>{loading ? 'Initialisation…' : 'Démarrer l’aventure'}</button>
                </div>
                {error && <p style={{ color: '#ffb3b3' }}>⚠️ {error}</p>}
              </motion.div>
            ) : (showPrologue ? (
              <motion.div key="prologue" variants={cardVariants} initial="initial" animate="animate" exit="exit" transition={cardTransition} style={{ ...card, transformPerspective: 1000 }}>
                {loading && !prologue ? (
                  <>
                    <LoadingGlyph />
                    <p style={{ opacity: 0.8, textAlign: 'center', margin: 0 }}>Confection du prologue…</p>
                  </>
                ) : (
                  <>
                    <h3 style={{ marginTop: 0, marginBottom: 8 }}>Prologue</h3>
                    <div style={{ whiteSpace: 'pre-wrap', opacity: 0.9, marginBottom: 12, lineHeight: 1.75, fontWeight: 600 }}>{prologue}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={btnPrimary} onClick={() => setShowPrologue(false)}>Entrer dans l’action →</button>
                      <button style={btn} onClick={reset}>↺ Recommencer</button>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key={activeScene?.id || 'scene'} variants={cardVariants} initial="initial" animate="animate" exit="exit" transition={cardTransition} style={{ ...card, transformPerspective: 1000 }}>
                {activeScene?.img && (
                  <div style={{ aspectRatio: '16 / 9', background: '#0b0b0f', borderRadius: 12, overflow: 'hidden', marginBottom: 12, border: '1px solid #1c2230' }}>
                    <img src={activeScene.img} alt="Illustration de la scène" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                {loading ? (
                  <>
                    <LoadingGlyph />
                    <p style={{ opacity: 0.8, textAlign: 'center', margin: 0 }}>Le Maître de Jeu tisse le destin…</p>
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
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button style={btnPrimary} onClick={reset}>↺ Recommencer</button>
                        </div>
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
                      <button style={btn} onClick={reset}>↺ Recommencer</button>
                    </div>
                    {error && <p style={{ color: '#ffb3b3' }}>⚠️ {error}</p>}
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div style={bottombar}>
          <small style={{ opacity: 0.75 }}>Sécurité : l'état du jeu est maintenant géré côté serveur.</small>
        </div>
      </div>
    </div>
  );
}
