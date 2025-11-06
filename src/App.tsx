
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';
import LoadingGlyph from './components/LoadingGlyph';
import MagicButton from './components/MagicButton';
import WordCloud, { type WordCloudSubmit } from './components/WordCloud';
import MagicCursor from './components/MagicCursor';
import { useGameStore } from './state/gameStore';
import { page, rightPane, topbar, bottombar, card, btn, contentWrap, engineBadge, engineBadgeDot } from './styles/ui';
import { getUniverseById } from './lib/universes';

const cardVariants: Variants = {
  initial: { opacity: 0, y: 40, scale: 0.95, rotateX: 8, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -40, scale: 0.96, rotateX: -6, filter: 'blur(8px)' },
};
const cardTransition: Transition = { type: 'spring', stiffness: 120, damping: 18, mass: 0.9 };
const sceneNarrationClamp = 'clamp(360px, 50vw, 720px)';
const sceneBodyClamp = 'clamp(280px, 34vw, 520px)';
const sceneNarrationStyle: CSSProperties = {
  marginBottom: 12,
  whiteSpace: 'pre-wrap',
  lineHeight: 1.9,
  fontWeight: 600,
  fontSize: 'clamp(18px, 2.1vw, 28px)',
  width: '100%',
  maxWidth: sceneNarrationClamp,
  textAlign: 'left',
};
const sceneQuestionStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  opacity: 0.92,
  width: '100%',
  maxWidth: sceneBodyClamp,
  fontSize: 'clamp(16px, 1.9vw, 24px)',
  lineHeight: 1.7,
  textAlign: 'left',
};
const sceneChoicesStackStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  width: '100%',
  maxWidth: sceneBodyClamp,
};
const sceneContentStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 22,
  width: '100%',
};
const loadingTextStyle: CSSProperties = {
  opacity: 0.9,
  textAlign: 'center',
  margin: 0,
  fontSize: 'clamp(18px, 2vw, 26px)',
  letterSpacing: 0.4,
};

export default function App() {
  // Zustand store for all game-related state
  const {
    started, loading, error,
    history, activeSceneIndex,
    startGame, makeChoice, answerChallenge, goBack, reset, mode,
  } = useGameStore();

  const activeScene = history[activeSceneIndex];
  const [scenePreview, setScenePreview] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const engineLabel = mode === 'local' ? 'Gemini Nano (local)' : mode === 'remote' ? 'Gemini Cloud' : 'Moteur inactif';
  const engineColor = mode === 'local' ? '#4ade80' : mode === 'remote' ? '#60a5fa' : '#94a3b8';
  const engineStatus = loading ? 'Génération en cours...' : engineLabel;

  const handleStartGame = ({ universeId, words }: WordCloudSubmit) => {
    const universe = getUniverseById(universeId);
    if (!universe) {
      console.warn('[App] Univers selectionne introuvable:', universeId);
      return;
    }

    const conceptList = words.join(', ');
    const storyPrompt = `Univers ${universe.label} — ${universe.description} | Concepts joueurs : ${conceptList}.`;
    startGame({
      genre: universe.genre,
      ton: universe.ton,
      pov: universe.pov,
      cadre: storyPrompt,
    });
  };

  const gradientKeyframes = useMemo(() => {
    const steps = 12;
    const buildSmoothSequence = (start: number, min: number, max: number, delta: number) => {
      const seq: number[] = [start];
      for (let i = 1; i < steps - 1; i++) {
        const prev = seq[seq.length - 1];
        const next = Math.max(min, Math.min(max, prev + (Math.random() * 2 - 1) * delta));
        seq.push(next);
      }
      seq.push(start);
      return seq;
    };
    const toPercent = (values: number[]) => values.map((value) => `${value.toFixed(2)}%`);
    const toFixed = (values: number[], digits: number) => values.map((value) => value.toFixed(digits));

    const cornerXSteps = buildSmoothSequence(0, -8, 8, 3);
    const cornerYSteps = buildSmoothSequence(0, -8, 8, 3);
    const g1x = toPercent(cornerXSteps.map((offset) => -12 + offset));
    const g1y = toPercent(cornerYSteps.map((offset) => -12 + offset));
    const g2x = toPercent(cornerXSteps.map((offset) => 112 + offset));
    const g2y = toPercent(cornerYSteps.map((offset) => -10 + offset));
    const g3x = toPercent(cornerXSteps.map((offset) => -10 + offset));
    const g3y = toPercent(cornerYSteps.map((offset) => 112 + offset));
    const g4x = toPercent(cornerXSteps.map((offset) => 114 + offset));
    const g4y = toPercent(cornerYSteps.map((offset) => 110 + offset));
    const flareX = toPercent(buildSmoothSequence(58, 36, 82, 5));
    const flareY = toPercent(buildSmoothSequence(24, 10, 48, 5));
    const flareOpacity = toFixed(buildSmoothSequence(0.09, 0.05, 0.16, 0.012), 3);

    const intensityRange = { min: 0.08, max: 0.26 };
    const normalize = (value: number) => (value - intensityRange.min) / (intensityRange.max - intensityRange.min);
    const corners = [
      { x: 6, y: 10, intensity: 0.2 },
      { x: 94, y: 12, intensity: 0.24 },
      { x: 92, y: 88, intensity: 0.26 },
      { x: 8, y: 90, intensity: 0.22 },
    ];
    const center = { x: 52, y: 50, intensity: 0.14 };
    const shuffledCorners = [...corners].sort(() => Math.random() - 0.5);
    const path: Array<{ x: number; y: number; intensity: number }> = [center];
    shuffledCorners.forEach((corner, index) => {
      path.push({
        x: center.x + (Math.random() * 8 - 4),
        y: center.y + (Math.random() * 6 - 3),
        intensity: center.intensity + (Math.random() * 0.03 - 0.015),
      });
      path.push(corner);
      if (index === Math.floor(shuffledCorners.length / 2)) {
        path.push({
          x: 50 + (Math.random() * 10 - 5),
          y: 18 + (Math.random() * 8 - 4),
          intensity: 0.18 + Math.random() * 0.04,
        });
      }
    });
    path.push({
      x: center.x + (Math.random() * 6 - 3),
      y: center.y + (Math.random() * 6 - 3),
      intensity: center.intensity,
    });

    const pulsePath = path.map((frame, index) => {
      const angle = (index / path.length) * Math.PI * 1.8;
      const radius = 7 + Math.sin(angle * 0.9) * 5;
      const driftX = Math.cos(angle) * radius;
      const driftY = Math.sin(angle) * radius * 0.75;
      const jitterX = Math.random() * 3 - 1.5;
      const jitterY = Math.random() * 3 - 1.5;

      return {
        x: Math.max(0, Math.min(100, frame.x + driftX + jitterX)),
        y: Math.max(0, Math.min(100, frame.y + driftY + jitterY)),
        intensity: Math.max(
          intensityRange.min,
          Math.min(intensityRange.max, frame.intensity + (Math.random() * 0.04 - 0.02)),
        ),
      };
    });
    const basePulseX = pulsePath.map((frame) => frame.x);
    const basePulseY = pulsePath.map((frame) => frame.y);
    const pulseIntensity = pulsePath.map((frame) => frame.intensity);
    const frameCount = pulseIntensity.length || 1;
    const fadeWave = (index: number) => {
      const wave = (Math.sin((index / frameCount) * Math.PI * 1.7) + 1) / 2;
      return Math.pow(wave, 1.25);
    };
    const sizeWave = (index: number) => 0.72 + 0.28 * Math.sin((index / frameCount) * Math.PI * 1.3 + Math.PI / 5);

    const pulseOpacity = pulseIntensity.map((value, index) => {
      const base = 0.24 + normalize(value) * 0.62;
      const envelope = 0.35 + 0.65 * fadeWave(index);
      const blended = Math.min(0.95, Math.max(0.08, base * envelope));
      return blended.toFixed(3);
    });

    const scaleMin = 32;
    const scaleMax = 74;
    const pulseScale = pulseIntensity.map((value, index) => {
      const t = Math.max(0, Math.min(1, normalize(value)));
      const baseScale = scaleMin + (1 - t) * (scaleMax - scaleMin);
      const modulated = baseScale * sizeWave(index);
      return `${modulated.toFixed(1)}%`;
    });
    const pulseX = toPercent(basePulseX.map((value, index) => {
      const drift = Math.sin((index / frameCount) * Math.PI * 1.55) * 18;
      return Math.max(0, Math.min(100, value + drift));
    }));
    const pulseY = toPercent(basePulseY.map((value, index) => {
      const drift = Math.cos((index / frameCount) * Math.PI * 1.35) * 12;
      return Math.max(0, Math.min(100, value + drift));
    }));

    return {
      g1x,
      g1y,
      g2x,
      g2y,
      g3x,
      g3y,
      g4x,
      g4y,
      flareX,
      flareY,
      flareOpacity,
      pulseScale,
      pulseOpacity,
      pulseX,
      pulseY,
    };
  }, []);

  return (
    <>
    <MagicCursor />
    <motion.div
      style={page}
      animate={{
        '--g1x': gradientKeyframes.g1x,
        '--g1y': gradientKeyframes.g1y,
        '--g2x': gradientKeyframes.g2x,
        '--g2y': gradientKeyframes.g2y,
        '--g3x': gradientKeyframes.g3x,
        '--g3y': gradientKeyframes.g3y,
        '--g4x': gradientKeyframes.g4x,
        '--g4y': gradientKeyframes.g4y,
        '--flareX': gradientKeyframes.flareX,
        '--flareY': gradientKeyframes.flareY,
        '--flareOpacity': gradientKeyframes.flareOpacity,
        '--pulseScale': gradientKeyframes.pulseScale,
        '--pulseOpacity': gradientKeyframes.pulseOpacity,
        '--pulseX': gradientKeyframes.pulseX,
        '--pulseY': gradientKeyframes.pulseY,
      }}
      transition={{
        duration: 60,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
      }}
    >
        <div style={rightPane}>
          <div style={topbar}>
            <button
              type="button"
              onClick={reset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <img src="/logo.webp" alt="HuntChapter" style={{ height: 64, width: 'auto', display: 'block' }} />
            </button>
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
        <div style={{ position: 'relative',  flex: 1, display: 'grid', placeItems: 'center' }}>
          <AnimatePresence mode="wait">
            {!started ? (
              <motion.div
                key="intro"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={cardTransition}
                style={{
                  ...card,
                  width: '100%',
                  height: '100%',
                  maxWidth: '100%',
                  transformPerspective: 1000,
                  margin: '0 auto',
                 
                  boxSizing: 'border-box',
                }}
              >
                <WordCloud onSubmit={handleStartGame} loading={loading} />
                {error && <p style={{ color: '#ffb3b3', textAlign: 'center' }}>⚠️ {error}</p>}
              </motion.div>
            ) : (
              <motion.div key={activeScene?.id || 'scene'} variants={cardVariants} initial="initial" animate="animate" exit="exit" transition={cardTransition} style={{ ...card, transformPerspective: 1000 ,flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',justifyContent: 'center' }}>
                {activeScene?.img && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setScenePreview(activeScene.img!)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setScenePreview(activeScene.img!);
                      }
                    }}
                    style={{
                      aspectRatio: '1 / 1',
                      width: 'min(80vw, 520px)',
                      maxHeight: 'min(55vh, 520px)',
                      background: '#0b0b0f',
                      borderRadius: 18,
                      overflow: 'hidden',
                      marginBottom: 28,
                      border: '1px solid #1c2230',
                      cursor: 'zoom-in',
                    }}
                  >
                    <img
                      src={activeScene.img}
                      alt="Illustration de la scène"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                )}
                {loading ? (
                  <>
                    <LoadingGlyph />
                    <p style={loadingTextStyle}>Le destin se tisse…</p>
                  </>
                ) : (
                  <div style={sceneContentStackStyle}>
                    {activeScene?.challenge ? (
                      <>
                        <div style={sceneNarrationStyle}>{activeScene.narration}</div>
                        <h3 style={{ margin: '8px 0 6px 0' }}>Épreuve</h3>
                        <p style={sceneQuestionStyle}>{activeScene.challenge.question}</p>
                        <div style={sceneChoicesStackStyle}>
                          {activeScene.challenge.choices.map((label, idx) => (
                            <MagicButton key={idx} onClick={() => answerChallenge(label, idx)}>{label}</MagicButton>
                          ))}
                        </div>
                      </>
                    ) : ((activeScene?.status && activeScene.status !== 'ongoing') || (activeScene?.options?.length ?? 0) === 0) ? (
                      <>
                        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Épilogue{activeScene?.endingTitle ? ` — ${activeScene.endingTitle}` : ''}</h3>
                        <div style={sceneNarrationStyle}>{activeScene?.narration}</div>
                      </>
                    ) : (
                      <>
                        <div style={sceneNarrationStyle}>{activeScene?.narration}</div>
                        <div style={sceneChoicesStackStyle}>
                          {activeScene?.options?.map((opt, i) => (
                            <MagicButton key={i} onClick={() => makeChoice(opt)}>{opt}</MagicButton>
                          ))}
                        </div>
                      </>
                    )}
                    {activeSceneIndex > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button style={btn} onClick={goBack}>← Précédent</button>
                      </div>
                    )}
                    {error && <p style={{ color: '#ffb3b3' }}>⚠️ {error}</p>}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={bottombar}>
         
        </div>
        </div>
      </div>
    </motion.div>
    <AnimatePresence>
      {scenePreview && (
        <motion.div
          key="scene-preview"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 50%, rgba(6,8,20,0.4) 0%, rgba(3,4,10,0.85) 60%, rgba(3,4,10,0.95) 100%)',
            zIndex: 3000,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setScenePreview(null)}
        >
          <motion.div
            style={{
              width: 'min(82vw, 640px)',
              maxHeight: 'min(80vh, 640px)',
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid rgba(118,140,220,0.4)',
              boxShadow: '0 50px 140px rgba(4,6,14,0.75)',
            }}
            initial={{ scale: 0.9, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
          >
            <img src={scenePreview} alt="Illustration agrandie" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
      {!isMobile && (
        <div style={{ ...engineBadge, opacity: started ? 1 : 0.8 }}>
          <span style={{ ...engineBadgeDot, color: engineColor, backgroundColor: engineColor }} />
          <span>{engineStatus}</span>
        </div>
      )}
    </>
  );
}
