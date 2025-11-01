import { AnimatePresence, motion } from 'framer-motion';
import LoadingGlyph from './components/LoadingGlyph';
import MagicButton from './components/MagicButton';
import Field from './components/Field';
import Options from './components/Options';
import { useStoryEngine } from './state/useStoryEngine';
import { page, rightPane, topbar, bottombar, card, btn, btnPrimary } from './styles/ui';

const cardVariants = {
  initial: { opacity: 0, y: 40, scale: 0.95, rotateX: 8, filter: 'blur(8px)' as any },
  animate: { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' as any },
  exit:    { opacity: 0, y: -40, scale: 0.96, rotateX: -6, filter: 'blur(8px)' as any },
};
const cardTransition = { type: 'spring', stiffness: 120, damping: 18, mass: 0.9 };

export default function App() {
  const {
    genre, ton, pov, cadre, setGenre, setTon, setPov, setCadre,
    started, loading, error, prologue, showPrologue, setShowPrologue,
    history, active,
    startGame, pickOption, answerChallenge, reset,
  } = useStoryEngine({ genre: 'Fantasy', ton: 'Épique', pov: 'tu', cadre: 'Monde original' });

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
                  <Field label="Point de vue"><Options current={pov as 'je' | 'tu'} setCurrent={setPov as any} items={['tu','je'] as any} /></Field>
                  <Field label="Cadre"><Options current={cadre} setCurrent={setCadre} items={['Monde original','Ville moderne','Espace lointain','Médiéval','Post-apo']} /></Field>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button style={btnPrimary} onClick={startGame} disabled={loading}>{loading ? 'Initialisation…' : 'Démarrer l’aventure'}</button>
                </div>
                <p style={{ opacity: 0.6, marginTop: 8, fontSize: 12 }}>Astuce: ajoute <code>VITE_GEMINI_API_KEY</code> dans <code>.env.local</code></p>
                {error && <p style={{ color: '#ffb3b3' }}>⚠️ {error}</p>}
              </motion.div>
            ) : (showPrologue ? (
              <motion.div key="prologue" variants={cardVariants} initial="initial" animate="animate" exit="exit" transition={cardTransition} style={{ ...card, transformPerspective: 1000 }}>
                {loading ? (
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
              <motion.div key={history[active]?.id || 'scene'} variants={cardVariants} initial="initial" animate="animate" exit="exit" transition={cardTransition} style={{ ...card, transformPerspective: 1000 }}>
                {history[active]?.img && (
                  <div style={{ aspectRatio: '16 / 9', background: '#0b0b0f', borderRadius: 12, overflow: 'hidden', marginBottom: 12, border: '1px solid #1c2230' }}>
                    <img src={history[active]!.img} alt="Illustration de la scène" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                {loading ? (
                  <>
                    <LoadingGlyph />
                    <p style={{ opacity: 0.8, textAlign: 'center', margin: 0 }}>Le Maître de Jeu tisse le destin…</p>
                  </>
                ) : (
                  <>
                    {history[active]?.challenge ? (
                      <>
                        <div style={{ marginBottom: 10, whiteSpace: 'pre-wrap', lineHeight: 1.75, fontWeight: 600 }}>{history[active]?.narration}</div>
                        <h3 style={{ margin: '8px 0 6px 0' }}>Épreuve</h3>
                        <p style={{ marginTop: 0, marginBottom: 10, opacity: 0.9 }}>{history[active]!.challenge!.question}</p>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {history[active]!.challenge!.choices.map((label, idx) => (
                            <MagicButton key={idx} onClick={() => answerChallenge(label, idx)}>{label}</MagicButton>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button style={btn} onClick={reset}>↺ Recommencer</button>
                        </div>
                      </>
                    ) : ((history[active]?.status && history[active]?.status !== 'ongoing') || (history[active]?.options?.length ?? 0) === 0) ? (
                      <>
                        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Épilogue{history[active]?.endingTitle ? ` — ${history[active]!.endingTitle}` : ''}</h3>
                        <div style={{ marginBottom: 10, whiteSpace: 'pre-wrap', lineHeight: 1.75, fontWeight: 600 }}>{history[active]?.narration}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button style={btnPrimary} onClick={reset}>↺ Recommencer</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ marginBottom: 10, whiteSpace: 'pre-wrap', lineHeight: 1.75, fontWeight: 600 }}>{history[active]?.narration}</div>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {history[active]?.options?.map((opt, i) => (
                            <MagicButton key={i} onClick={() => pickOption(opt)}>{opt}</MagicButton>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button style={btn} onClick={reset}>↺ Recommencer</button>
                        </div>
                      </>
                    )}
                    {error && <p style={{ color: '#ffb3b3' }}>⚠️ {error}</p>}
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div style={bottombar}>
          <small style={{ opacity: 0.75 }}>Sécurité : contenu sensible filtré via prompt. Pour la prod, déplace l’appel LLM côté serveur · Image générée automatiquement.</small>
        </div>
      </div>
    </div>
  );
}