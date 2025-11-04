import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import MagicButton from './MagicButton';

const wordsList = [
  'Forêt', 'Château', 'Dragon', 'Magie', 'Trésor', 'Quête', 'Princesse', 'Chevalier', 'Épée',
  'Mystère', 'Nuit', 'Étoiles', 'Lune', 'Ombre', 'Secret', 'Destin', 'Courage', 'Peur',
  'Amour', 'Haine', 'Vengeance', 'Alliance', 'Trahison', 'Prophétie', 'Ancien', 'Artefact',
  'Créature', 'Royaume', 'Guerre', 'Paix', 'Honneur', 'Gloire', 'Ruines', 'Savoir', 'Pouvoir',
  'Voyage', 'Temps', 'Portail', 'Île', 'Désert', 'Montagne', 'Océan', 'Rivière', 'Cité',
  'Légende', 'Mythe', 'Héros', 'Monstre', 'Dieu', 'Esprit','Rituel', 'Cauchemar', 'Tombeau', 'Reliques', 'Abysses', 'Malédiction', 'Sanctuaire', 'Oracle', 'Vision', 'Sépulcre',
  'Corruption', 'Ténèbres', 'Lumière', 'Sang', 'Pacte', 'Énigme', 'Labyrinthe', 'Hurlement', 'Chuchotement', 'Spectre',
  'Nécromancien', 'Alchimie', 'Runes', 'Arcanes', 'Inquisiteur', 'Révélation', 'Crépuscule', 'Aube', 'Éclipse', 'Faille',
  'Souterrain', 'Catacombes', 'Fantôme', 'Ombres', 'Gardiens', 'Veilleur', 'Effroi', 'Folie', 'Serment', 'Trône',
  'Bannière', 'Conjuration', 'Invocation', 'Dague', 'Poison', 'Clairvoyance', 'Prophète', 'Vestiges', 'Grimoire', 'Obélisque',
];

const MAX_SELECTION = 6;
const DROP_ZONE_HEIGHT = 110;
const MOBILE_BREAKPOINT = 768;

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  container: {
    width: 'min(100%, 960px)',
    minHeight: 420,
    position: 'relative',
    border: 'none',
    background: 'transparent',
    borderRadius: 20,
    padding: 0,
    boxSizing: 'border-box',
    overflow: 'visible',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  wordsLayer: {
    width: '100%',
    padding: '16px 10px 4px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gridAutoRows: 'minmax(34px, auto)',
    gap: '14px clamp(10px, 4vw, 28px)',
    boxSizing: 'border-box',
    alignContent: 'start',
    zIndex: 2,
    overflow: 'visible',
    flex: '0 0 auto',
  },
  word: {
    padding: '8px 12px',
    margin: 0,
    color: '#f5f7ff',
    background: 'transparent',
    borderRadius: 16,
    cursor: 'grab',
    userSelect: 'none',
    position: 'relative',
    fontSize: 'clamp(12px, 2.4vw, 16px)',
    fontWeight: 500,
    border: 'none',
    boxShadow: '0 6px 18px rgba(255,255,255,0.2)',
    touchAction: 'none',
    transformStyle: 'preserve-3d',
    transformPerspective: 700,
    willChange: 'transform',
    textAlign: 'center',
  },
  dropZone: {
    width: '100%',
    minHeight: DROP_ZONE_HEIGHT,
    padding: '16px 18px',
    boxSizing: 'border-box',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    color: '#f5f7ff',
    zIndex: 1,
    borderRadius: 18,
    boxShadow: 'inset 0 0 28px rgba(255,255,255,0.12)',
    transition: 'box-shadow 0.2s ease',
  },
  dropZoneHover: {
    boxShadow: '0 0 28px rgba(255,255,255,0.25), inset 0 0 28px rgba(255,255,255,0.2)',
  },
  dropZoneWords: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  selectedWordPill: {
    padding: '5px 12px',
    background: '#1c2230',
    color: '#61dafb',
    borderRadius: 8,
    fontSize: 14,
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { scale: 0.92, opacity: 0, transition: { duration: 0.3 } },
};

type WordOrigin = 'cloud' | 'drop';

type WordProps = {
  text: string;
  origin: WordOrigin;
  containerRef: RefObject<HTMLDivElement>;
  canDrop: boolean;
  onMoveToDrop: () => void;
  onMoveToCloud: () => void;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  pointerActive: boolean;
};

const Word = ({
  text,
  origin,
  containerRef,
  canDrop,
  onMoveToDrop,
  onMoveToCloud,
  mouseX,
  mouseY,
  pointerActive,
}: WordProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const tiltX = useSpring(0, { stiffness: 220, damping: 24, mass: 0.6 });
  const tiltY = useSpring(0, { stiffness: 220, damping: 24, mass: 0.6 });
  const MAX_TILT = 32;

  useEffect(() => {
    if (!containerRef.current || !ref.current) return;

    const update = () => {
      if (!containerRef.current || !ref.current) return;

      if (!pointerActive) {
        tiltX.set(0);
        tiltY.set(0);
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const wordRect = ref.current.getBoundingClientRect();
      const pointerX = mouseX.get();
      const pointerY = mouseY.get();
      const wordCenterX = wordRect.left - containerRect.left + wordRect.width / 2;
      const wordCenterY = wordRect.top - containerRect.top + wordRect.height / 2;
      const dx = pointerX - wordCenterX;
      const dy = pointerY - wordCenterY;
      const dist = Math.hypot(dx, dy);
      const maxDist = 200;
      const influence = Math.max(0, 1 - dist / maxDist);
      const eased = Math.pow(influence, 0.6);

      tiltY.set((dx / Math.max(1, maxDist)) * MAX_TILT * 2.4 * eased);
      tiltX.set((-dy / Math.max(1, maxDist)) * MAX_TILT * 2.4 * eased);
    };

    const unsubX = mouseX.on('change', update);
    const unsubY = mouseY.on('change', update);
    update();

    return () => {
      unsubX();
      unsubY();
    };
  }, [mouseX, mouseY, pointerActive, containerRef, tiltX, tiltY]);

  const handleTapSelect = () => {
    if (origin === 'cloud') {
      if (canDrop) onMoveToDrop();
    } else {
      onMoveToCloud();
    }
  };

  return (
    <motion.div
            ref={ref}
          layout
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.96 }}
      whileDrag={{ scale: 1.04, boxShadow: '0 14px 32px rgba(255,255,255,0.3)', zIndex: 12 }}
      transition={{ type: 'spring', stiffness: 480, damping: 32 }}
      style={{
        ...styles.word,
        cursor: 'pointer',
        touchAction: 'pan-y',
        rotateX: tiltX,
        rotateY: tiltY,
      }}
      onClick={handleTapSelect}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>{text}</span>
    </motion.div>
  );
};

export default function WordCloud({ onSubmit, loading }: { onSubmit: (words: string[]) => void; loading: boolean }) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointerActive, setPointerActive] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cloudLayerRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const checkViewport = () => {
      setIsCompact(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    if (isCompact) {
      setPointerActive(false);
    }
  }, [isCompact]);

  const shuffledWords = useMemo(
    () => [...wordsList].sort(() => Math.random() - 0.5).slice(0, 50),
    [],
  );

  const cloudWords = useMemo(
    () => shuffledWords.filter((word) => !selectedWords.includes(word)),
    [shuffledWords, selectedWords],
  );

  const handleWordDrop = (word: string) => {
    setSelectedWords((prev) => {
      if (prev.length >= MAX_SELECTION || prev.includes(word)) {
        return prev;
      }
      return [...prev, word];
    });
  };

  const handleWordReturn = (word: string) => {
    setSelectedWords((prev) => prev.filter((entry) => entry !== word));
  };

  const handleSubmit = () => {
    if (selectedWords.length === MAX_SELECTION && !loading && !isSubmitting) {
      setIsSubmitting(true);
      onSubmit([...selectedWords]);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  };

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    handlePointerMove(event);
    setPointerActive(true);
  };

  const handlePointerLeave = () => {
    setPointerActive(false);
  };

  const responsiveContainer = useMemo(() => ({
    ...styles.container,
    ...(isCompact ? {
      height: 'calc(100dvh - 200px)',
      maxHeight: 'calc(100dvh - 200px)',
      width: '100%',
    } : {}),
  }), [isCompact]);

  const responsiveWordsLayer = useMemo(() => ({
    ...styles.wordsLayer,
    ...(isCompact ? {
      flex: 1,
      overflowY: 'auto',
      paddingBottom: 16,
      overscrollBehavior: 'contain',
      WebkitOverflowScrolling: 'touch' as const,
    } : {}),
  }), [isCompact]);

  const responsiveDropZone = useMemo(() => ({
    ...styles.dropZone,
    ...(isCompact ? {
      position: 'sticky' as const,
      bottom: 0,
    } : {}),
  }), [isCompact]);

  const instructionText = isCompact ? 'Touchez 6 mots ici' : 'Glissez 6 mots ici';
  const helperTextPrefix = isCompact ? 'Touchez' : 'Glissez';
  const dropHover = selectedWords.length > 0 && selectedWords.length < MAX_SELECTION;

  return (
    <AnimatePresence>
      {!isSubmitting && (
        <motion.div
          style={styles.wrapper}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            ref={containerRef}
            style={{ ...responsiveContainer, overflow: 'hidden' }}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
          >
            <div
              ref={cloudLayerRef}
              style={{
                ...responsiveWordsLayer,
                overflow: isCompact ? 'auto' : 'visible',
              }}
            >
              {cloudWords.map((word) => (
                <Word
                  key={word}
                  text={word}
                  origin="cloud"
                  containerRef={containerRef}
                  canDrop={selectedWords.length < MAX_SELECTION}
                  onMoveToDrop={() => handleWordDrop(word)}
                  onMoveToCloud={() => {}}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  pointerActive={pointerActive}
                />
              ))}
            </div>

            <div
              ref={dropZoneRef}
              style={{
                ...responsiveDropZone,
                ...(dropHover ? styles.dropZoneHover : {}),
              }}
            >
              {selectedWords.length === 0 && (
                <div style={{ fontWeight: 600, fontSize: 14, color: '#f5f7ff' }}>{instructionText}</div>
              )}

              {selectedWords.length > 0 && (
                <div style={{ fontSize: 12, opacity: 0.85, color: '#f5f7ff' }}>
                  {selectedWords.length < MAX_SELECTION
                    ? `${helperTextPrefix} encore ${MAX_SELECTION - selectedWords.length} mot${
                        MAX_SELECTION - selectedWords.length !== 1 ? 's' : ''
                      }.`
                    : 'Sélection complète.'}
                </div>
              )}
              <div style={styles.dropZoneWords}>
                {selectedWords.map((word) => (
                  <Word
                    key={`drop-${word}`}
                    text={word}
                    origin="drop"
                    containerRef={containerRef}
                    canDrop={true}
                    onMoveToDrop={() => {}}
                    onMoveToCloud={() => handleWordReturn(word)}
                    mouseX={mouseX}
                    mouseY={mouseY}
                    pointerActive={pointerActive}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <AnimatePresence>
              {selectedWords.length === MAX_SELECTION && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <MagicButton onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Création...' : 'commencez.'}
                  </MagicButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
