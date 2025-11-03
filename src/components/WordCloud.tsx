import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, MotionValue, useSpring, animate } from 'framer-motion';
import MagicButton from './MagicButton';

// --- CONFIGURATION ---
const wordsList = [
  'Forêt', 'Château', 'Dragon', 'Magie', 'Trésor', 'Quête', 'Princesse', 'Chevalier', 'Épée',
  'Mystère', 'Nuit', 'Étoiles', 'Lune', 'Ombre', 'Secret', 'Destin', 'Courage', 'Peur',
  'Amour', 'Haine', 'Vengeance', 'Alliance', 'Trahison', 'Prophétie', 'Ancien', 'Artefact',
  'Créature', 'Royaume', 'Guerre', 'Paix', 'Honneur', 'Gloire', 'Ruines', 'Savoir', 'Pouvoir',
  'Voyage', 'Temps', 'Portail', 'Île', 'Désert', 'Montagne', 'Océan', 'Rivière', 'Cité',
  'Légende', 'Mythe', 'Héros', 'Monstre', 'Dieu', 'Esprit'
];
const shuffledWords = wordsList.sort(() => 0.5 - Math.random()).slice(0, 30);

const DROP_ZONE_HEIGHT = 110;

// --- STYLES ---
const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  container: {
    width: '100%',
    height: 400,
    position: 'relative',
    border: '1px solid #1c2230',
    background: '#ffffff',
    borderRadius: 12,
    padding: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
    cursor: 'pointer',
    perspective: '800px',
  },
  wordsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: DROP_ZONE_HEIGHT,
    padding: '20px 16px 12px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gridAutoRows: 'minmax(34px, auto)',
    gap: '8px 14px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    alignContent: 'start',
    zIndex: 2,
  },
  word: {
    padding: '6px 12px',
    margin: 0,
    color: '#111', // Dark text for contrast
    background: 'white', // Card-like background
    borderRadius: '8px',
    cursor: 'grab',
    fontSize: '16px',
    userSelect: 'none',
    position: 'relative',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
  },
  dropZone: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: DROP_ZONE_HEIGHT,
    padding: '18px 24px 16px',
    boxSizing: 'border-box',
    borderTop: '1px dashed #1c2230',
    background: 'rgba(12, 16, 24, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    color: '#c5d1ff',
    zIndex: 1,
  },
  dropZoneHover: {
    borderTopColor: '#61dafb',
    background: 'rgba(20, 32, 52, 0.92)',
  },
  selectedWordPill: {
    padding: '4px 10px',
    background: '#1c2230',
    color: '#61dafb',
    borderRadius: '6px',
    fontSize: '14px',
  },
};

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { scale: 0.9, opacity: 0, transition: { duration: 0.3 } },
};

// --- WORD COMPONENT ---
const Word = ({
  children,
  onDrop,
  mouseX,
  mouseY,
  containerRef,
  anyHovered,
  onHoverStartProp,
  onHoverEndProp,
  onDragStateChange,
  onDropZoneHover,
}: {
  children: string;
  onDrop: () => void;
  mouseX: MotionValue;
  mouseY: MotionValue;
  containerRef: React.RefObject<HTMLDivElement>;
  anyHovered: boolean;
  onHoverStartProp: () => void;
  onHoverEndProp: () => void;
  onDragStateChange: (dragging: boolean) => void;
  onDropZoneHover: (hover: boolean) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [floating, setFloating] = useState(false);
  const originRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const constraintsRef = useRef<{ top: number; left: number; right: number; bottom: number } | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dropTriggeredRef = useRef(false);

  // Cache the word center relative to the container at mount (and when layout changes)
  const wordCenter = useRef<{ x: number; y: number } | null>(null);

  const updateWordCenter = () => {
    if (!ref.current || !containerRef.current) return;
    const wordRect = ref.current.getBoundingClientRect();
    const contRect = containerRef.current.getBoundingClientRect();
    wordCenter.current = {
      x: wordRect.left - contRect.left + wordRect.width / 2,
      y: wordRect.top - contRect.top + wordRect.height / 2,
    };
  };

  useEffect(() => {
    updateWordCenter();
    // Recompute on resize:
    const onResize = () => updateWordCenter();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Map mouseX/mouseY (viewport) -> container-relative, then compute angle-based rotation (atan2) with distance falloff
  const rotateX = useTransform(mouseY, (mouseViewY) => {
    if (!containerRef.current || !wordCenter.current) return 0;
    if (hovered) return 0;
    const contRect = containerRef.current.getBoundingClientRect();
    const my = mouseViewY - contRect.top;
    const dy = my - wordCenter.current.y;
    const mx = (mouseX.get() ?? 0) - contRect.left;
    const dx = mx - wordCenter.current.x;
    const dist = Math.hypot(dx, dy);
    const R = 160;
    const t = 1 - dist / R;
    let influence = t > 0 ? Math.pow(t, 2.0) : 0;
    // Boost neighbors responsiveness when any word is hovered
    if (anyHovered) influence = Math.min(1, influence * 2.0);
    const angle = Math.atan2(dy, dx); // radians
    const maxDeg = 42;
    const base = Math.sin(angle) * maxDeg; // X tilt from vertical component
    return base * influence;
  });

  const rotateY = useTransform(mouseX, (mouseViewX) => {
    if (!containerRef.current || !wordCenter.current) return 0;
    if (hovered) return 0;
    const contRect = containerRef.current.getBoundingClientRect();
    const mx = mouseViewX - contRect.left;
    const dx = mx - wordCenter.current.x;
    const my = (mouseY.get() ?? 0) - contRect.top;
    const dy = my - wordCenter.current.y;
    const dist = Math.hypot(dx, dy);
    const R = 160;
    const t = 1 - dist / R;
    let influence = t > 0 ? Math.pow(t, 2.0) : 0;
    if (anyHovered) influence = Math.min(1, influence * 2.0);
    const angle = Math.atan2(dy, dx);
    const maxDeg = 42;
    const base = Math.cos(angle) * maxDeg; // Y tilt from horizontal component
    return base * influence;
  });

  const checkDropOverlap = () => {
    if (dropTriggeredRef.current) return;
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone || !ref.current) return;
    const dropRect = dropZone.getBoundingClientRect();
    const wordRect = ref.current.getBoundingClientRect();
    const overlaps = wordRect.left < dropRect.right && wordRect.right > dropRect.left && wordRect.top < dropRect.bottom && wordRect.bottom > dropRect.top;
    onDropZoneHover(overlaps);
    if (overlaps) {
      dropTriggeredRef.current = true;
      onDropZoneHover(false);
      onDrop();
      onHoverEndProp();
      x.stop();
      y.stop();
      x.set(0);
      y.set(0);
      setFloating(false);
      setIsDragging(false);
      onDragStateChange(false);
      originRef.current = null;
      constraintsRef.current = null;
    }
  };

  useEffect(() => {
    if (!floating) return;
    const unsubX = x.on('change', checkDropOverlap);
    const unsubY = y.on('change', checkDropOverlap);
    return () => {
      unsubX && unsubX();
      unsubY && unsubY();
    };
  }, [floating]);

  const baseStyle = floating && originRef.current ? {
    ...styles.word,
    position: 'absolute' as const,
    left: originRef.current.left,
    top: originRef.current.top,
    width: originRef.current.width,
    height: originRef.current.height,
    transformOrigin: 'center',
    rotateX,
    rotateY,
    zIndex: 20,
    x,
    y,
  } : {
    ...styles.word,
    transformOrigin: 'center',
    rotateX,
    rotateY,
    zIndex: hovered || isDragging ? 10 : 1,
  };

  return (
    <motion.div
      ref={ref}
      style={baseStyle}
      drag
      dragMomentum={true}
      dragElastic={0.25}
      dragConstraints={floating ? constraintsRef.current ?? undefined : containerRef}
      whileDrag={{ scale: 1.04 }}
      onHoverStart={() => { setHovered(true); updateWordCenter(); onHoverStartProp(); }}
      onHoverEnd={() => { setHovered(false); onHoverEndProp(); }}
      onDragStart={() => {
        setIsDragging(true);
        dropTriggeredRef.current = false;
        onDropZoneHover(false);
        updateWordCenter();
        if (ref.current && containerRef.current) {
          const wordRect = ref.current.getBoundingClientRect();
          const contRect = containerRef.current.getBoundingClientRect();
          const origin = {
            left: wordRect.left - contRect.left,
            top: wordRect.top - contRect.top,
            width: wordRect.width,
            height: wordRect.height,
          };
          originRef.current = origin;
          constraintsRef.current = {
            left: -origin.left,
            top: -origin.top,
            right: contRect.width - origin.width - origin.left,
            bottom: contRect.height - origin.height - origin.top,
          };
          x.set(0);
          y.set(0);
          setFloating(true);
        }
        onDragStateChange(true);
      }}
      onDrag={() => {
        checkDropOverlap();
      }}
      onDragEnd={(event, info) => {
        onDragStateChange(false);
        setIsDragging(false);
        if (dropTriggeredRef.current) return;
        onDropZoneHover(false);

        const finish = () => {
          setFloating(false);
          originRef.current = null;
          constraintsRef.current = null;
          onHoverEndProp();
        };

        const constraints = constraintsRef.current;
        const ctrlX = animate(x, 0, {
          type: 'inertia',
          velocity: info.velocity.x,
          power: 0.8,
          timeConstant: 280,
          bounceStiffness: 180,
          bounceDamping: 26,
          restDelta: 0.6,
          min: constraints?.left,
          max: constraints?.right,
        });
        const ctrlY = animate(y, 0, {
          type: 'inertia',
          velocity: info.velocity.y,
          power: 0.8,
          timeConstant: 280,
          bounceStiffness: 180,
          bounceDamping: 26,
          restDelta: 0.6,
          min: constraints?.top,
          max: constraints?.bottom,
        });

        Promise.all([ctrlX.finished, ctrlY.finished]).finally(() => {
          x.set(0);
          y.set(0);
          finish();
        });
      }}
      whileHover={{ scale: 1.14, boxShadow: '0 14px 38px rgba(0,0,0,0.40)' }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.div>
  );
};

// --- DROP ZONE COMPONENT ---
const DropZone = ({ active }: { active: boolean }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            id="drop-zone"
            style={{...styles.dropZone, ...((isHovered || active) ? styles.dropZoneHover : {})}}
            onDragOver={(e) => { e.preventDefault(); setIsHovered(true); }}
            onDragLeave={() => setIsHovered(false)}
            onDrop={() => setIsHovered(false)}
        >
            <div style={{ fontWeight: 600, fontSize: 14 }}>Glissez vos mots ici</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Zone de dépôt (4ᵉ quart)</div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function WordCloud({ onSubmit, loading }: { onSubmit: (words: string[]) => void, loading: boolean }) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [anyHovered, setAnyHovered] = useState(false);
  const [anyDragging, setAnyDragging] = useState(false);
  const [dropHover, setDropHover] = useState(false);

  const mouseXRaw = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const mouseYRaw = useMotionValue(typeof window !== "undefined" ? window.innerHeight / 2 : 0);
  // Smooth the cursor tracking like Framer's example (tracking the cursor)
  const mouseX = useSpring(mouseXRaw, { stiffness: 300, damping: 30, mass: 0.6 });
  const mouseY = useSpring(mouseYRaw, { stiffness: 300, damping: 30, mass: 0.6 });

  function handleMouse(event: React.MouseEvent) {
    mouseXRaw.set(event.clientX);
    mouseYRaw.set(event.clientY);
  };

  const handleWordDrop = (word: string) => {
    if (selectedWords.length < 6 && !selectedWords.includes(word)) {
      setSelectedWords(prev => [...prev, word]);
    }
  };

  const handleSubmit = () => {
    if (selectedWords.length === 6 && !loading) {
      setIsSubmitting(true);
    }
  };

  const handleExitComplete = () => {
    if (isSubmitting) {
      onSubmit(selectedWords);
    }
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {!isSubmitting && (
        <motion.div style={styles.wrapper} variants={containerVariants} initial="hidden" animate="visible" exit="exit">
          <motion.div
            ref={containerRef}
            style={{ ...styles.container, overflow: anyDragging ? 'visible' : 'hidden' }}
            onMouseMove={handleMouse}
          >
            <div style={{ ...styles.wordsLayer, overflow: anyDragging ? 'visible' : styles.wordsLayer.overflow }}>
              {shuffledWords.filter(w => !selectedWords.includes(w)).map(word => (
                <Word
                  key={word}
                  onDrop={() => handleWordDrop(word)}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  containerRef={containerRef}
                  anyHovered={anyHovered}
                  onHoverStartProp={() => {
                    setAnyHovered(true);
                  }}
                  onHoverEndProp={() => {
                    setAnyHovered(false);
                  }}
                  onDragStateChange={(dragging) => setAnyDragging(dragging)}
                  onDropZoneHover={setDropHover}
                >
                  {word}
                </Word>
              ))}
            </div>

            <DropZone active={dropHover} />
          </motion.div>

          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {selectedWords.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: '100%' }}>
                {selectedWords.map(word => (
                  <div key={word} style={styles.selectedWordPill}>{word}</div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {selectedWords.length < 6 ? `Encore ${6 - selectedWords.length} mot${(6 - selectedWords.length) !== 1 ? 's' : ''} à sélectionner.` : 'Sélection complète.'}
            </div>
            <AnimatePresence>
              {selectedWords.length === 6 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <MagicButton onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Création...' : 'Forger le destin'}
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
