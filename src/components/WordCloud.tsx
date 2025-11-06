import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import type React from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import MagicButton from './MagicButton';
import { UNIVERSES, type UniverseConfig } from '../lib/universes';
import { CARD_BASE_HEIGHT, CARD_EXPANDED_HEIGHT, DROP_ZONE_HEIGHT, MAX_SELECTION, MOBILE_BREAKPOINT } from './wordcloud/config';
import type { WordCloudStyles } from './wordcloud/types';
import UniverseSelection from './wordcloud/UniverseSelection';
import ImagePreview, { type PreviewImage } from './wordcloud/ImagePreview';

export type WordCloudSubmit = { universeId: string; words: string[] };

const DEFAULT_ART = {
  front: '/sf1.webp',
  back: '/sf2.webp',
};

const UNIVERSE_ART: Record<string, { front: string; back: string }> = {
  frontieres: {
    front: '/sf1.webp',
    back: '/sf2.webp',
  },
  arcanes: {
    front: '/fanta1.webp',
    back: '/fanta2.webp',
  },
  metropole: {
    front: '/thri1.webp',
    back: '/thri2.webp',
  },
  heritages: {
    front: '/hist1.webp',
    back: '/hist2.webp',
  },
};

const styles: WordCloudStyles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
    height: '100%',
    minHeight: '100%',
    flex: '1 1 auto',
   
    margin: '0 auto',
  },
  heroLogo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 6,
  },
  heroLogoImage: {
    width: 'clamp(220px, 50vw, 640px)',
    height: 'auto',
    filter: 'drop-shadow(0 25px 60px rgba(8,12,24,0.65))',
  },
  universePrompt: {
    fontWeight: 700,
    fontSize: 'clamp(18px, 2vw, 26px)',
    letterSpacing: 0.5,
    opacity: 0.9,
    color: '#f5f7ff',
    marginBottom: 28,
    textAlign: 'center' as const,
  },
  universeCompactPrompt: {
    fontWeight: 700,
    fontSize: 'clamp(18px, 2vw, 24px)',
    letterSpacing: 0.3,
    opacity: 0.88,
    color: '#f5f7ff',
    margin: '6px 0 16px',
    textAlign: 'center' as const,
  },
  container: {
    width: '100%',
    maxWidth: 1200,
    position: 'relative',
    border: 'none',
    background: 'transparent',
    borderRadius: 20,
    padding: '0 clamp(12px, 3vw, 32px)',
    boxSizing: 'border-box',
    overflow: 'visible',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 24,
    flex: '1 1 auto',
    minHeight: 420,
    height: '100%',
    margin: '0 auto',
  },
  wordsLayer: {
    width: '100%',
    padding: '16px 10px 24px',
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
    padding: '6px 10px',
    margin: 0,
    color: '#f5f7ff',
    background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.015) 70%, rgba(255,255,255,0) 100%)',
    borderRadius: 16,
    cursor: 'grab',
    userSelect: 'none',
    position: 'relative',
    fontSize: 'clamp(10px, 1.8vw, 12px)',
    fontWeight: 500,
    border: 'none',
    boxShadow: '0 8px 18px rgba(10,10,20,0.35)',
    touchAction: 'none',
    transformStyle: 'preserve-3d',
    transformPerspective: 700,
    willChange: 'transform',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    whiteSpace: 'nowrap' as const,
    lineHeight: 1,
  },
  dropZone: {
    width: '100%',
    minHeight: DROP_ZONE_HEIGHT,
    padding: '16px 18px',
   borderTop:  '2px solid rgba(255,255,255,0.12)',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    color: '#f5f7ff',
    zIndex: 1,
    maxWidth: 560,
    alignSelf: 'center',
    boxSizing: 'border-box' as const,
    
    // boxShadow: 'inset 0 0 28px rgba(255,255,255,0.12)',
    transition: 'box-shadow 0.2s ease',
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
  universesWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 0,
  },
  universeGrid: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    justifyContent: 'center',
    justifyItems: 'center',
  },
  universeCompactGrid: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 10,
    padding: '8px 10px 12px',
    marginBottom: 12,
  },
  universeCompactButton: {
    borderRadius: 14,
    border: '1px solid rgba(97,107,142,0.4)',
    background: 'rgba(16,20,32,0.7)',
    color: '#f5f7ff',
    fontSize: 12,
    letterSpacing: 0.25,
    padding: '8px 14px',
    minHeight: 46,
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    cursor: 'pointer',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
    outline: 'none',
    width: '100%',
    overflow: 'hidden',
  },
  universeCompactActive: {
    borderColor: '#61dafb',
    boxShadow: '0 0 14px rgba(97,218,251,0.25)',
    background: 'rgba(24,30,48,0.92)',
  },
  universeCompactGenre: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.65,
  },
  universeCompactLabel: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.25,
    wordBreak: 'break-word' as const,
  },
  universeCard: {
    borderRadius: 20,
    border: '1px solid rgba(97,107,142,0.45)',
     borderStyle: 'transparent !important',
    background: 'rgba(14,20,34,0.88)',
    padding: 0,
    minHeight: CARD_BASE_HEIGHT,
    // Let the card grow to accommodate content so buttons remain visible
    height: 'auto',
    minWidth: 180,
    maxWidth: 260,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    color: '#f5f7ff',
    cursor: 'pointer',
    overflow: 'hidden',
    position: 'relative',
    transformStyle: 'preserve-3d' as const,
    boxShadow: '0 5px 5px rgba(97,218,251,0.18)',
    perspective: 1200,
    outline: 'none',
  },
  universeCardActive: {
    borderColor: '#61dafb',
    boxShadow: '0 5px 18px rgba(97,218,251,0.18)',
  },
  universeBadge: {
    fontSize: 11.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    opacity: 0.78,
  },
  universeTitle: {
    margin: '0 0 6px 0',
    fontSize: 16,
    fontWeight: 600,
  },
  universeDescription: {
    margin: 0,
    fontSize: 13.5,
    opacity: 0.8,
    lineHeight: 1.5,
  },
  universe3dWrapper: {
    position: 'relative',
    width: '100%',
    // Ensure a consistent flipping area height so the back face is visible
    height: `${CARD_EXPANDED_HEIGHT}px`,
    overflow: 'hidden',
    transformStyle: 'preserve-3d' as const,
    borderRadius: 20,
  },
  universeFace: {
    position: 'absolute' as const,
    inset: 0,
    backfaceVisibility: 'hidden' as const,
    WebkitBackfaceVisibility: 'hidden' as any,
    padding: '14px 14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    overflow: 'hidden',
    borderRadius: 20,
  },
  universeFront: {
    // Make the face opaque to avoid seeing mirrored recto through transparency
    background: 'linear-gradient(155deg, rgb(24,30,58) 0%, rgb(9,12,24) 100%)',
    justifyContent: 'flex-start',
  },
  universeFrontTop: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  universeFrontImageFrame: {
    position: 'relative',
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    border: '1px solid rgba(118,140,220,0.34)',
    boxShadow: '0 20px 48px rgba(20,24,46,0.58)',
    paddingTop: '85%',
    cursor: 'zoom-in',
  },
  universeFrontImageAspect: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
  },
  universeFrontImage: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    filter: 'saturate(1.1)',
  },
  universeBack: {
    transform: 'rotateY(180deg)',
    // Match front face background while keeping opacity
    background: 'linear-gradient(155deg, rgb(24,30,58) 0%, rgb(9,12,24) 100%)',
    padding: '24px 24px 26px',
    gap: 18,
  },
  universeBackImageFrame: {
    position: 'relative',
    width: '100%',
    paddingTop: '90%',
    borderRadius: 18,
    overflow: 'hidden',
    border: '1px solid rgba(118,140,220,0.34)',
    boxShadow: '0 20px 48px rgba(20,24,46,0.58)',
    cursor: 'zoom-in',
  },
  universeBackImageFrameSmall: {
    position: 'relative',
    width: '100%',
    paddingTop: '56.25%',
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 1)',
    boxShadow: '0 16px 36px rgba(42,22,12,0.45)',
  },
  universeBackImage: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  universeBackText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    color: '#f5f7ff',
  },
  universeMoreBtn: {
    marginTop: 16,
    alignSelf: 'flex-start',
    padding: '8px 16px',
    borderRadius: 999,
    border: '1px solid rgba(118,140,220,0.4)',
    background: 'rgba(20,26,44,0.85)',
    color: '#d2e2ff',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 10px 24px rgba(12,16,30,0.35)',
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
  compact: boolean;
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
  compact,
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

  const hoverScale = compact ? 1.06 : 1.18;
  const hoverLift = compact ? -2 : -4;

  return (
    <motion.div
            ref={ref}
          layout
      whileHover={{
        scale: hoverScale,
        y: hoverLift,
        boxShadow: compact ? '0 10px 20px rgba(18,22,38,0.45)' : '0 16px 34px rgba(26,32,56,0.55)',
        background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0) 100%)',
      }}
      whileTap={{ scale: compact ? 0.96 : 0.94 }}
      whileDrag={{
        scale: 1.04,
        boxShadow: '0 16px 34px rgba(40,48,76,0.55)',
        zIndex: 12,
        overflow: 'hidden',
      }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
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

export default function WordCloud({
  onSubmit,
  loading,
}: {
  onSubmit: (payload: WordCloudSubmit) => void;
  loading: boolean;
}) {
  const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);
  const [hoveredUniverseId, setHoveredUniverseId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointerActive, setPointerActive] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [imagePreview, setImagePreview] = useState<PreviewImage>(null);

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

  const hideImagePreview = useCallback(() => {
    setImagePreview(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideImagePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hideImagePreview]);

  const showImagePreview = useCallback((src: string, alt: string) => {
    setImagePreview({ src, alt });
  }, []);

  const selectedUniverse = useMemo<UniverseConfig | null>(
    () => (selectedUniverseId ? UNIVERSES.find((universe) => universe.id === selectedUniverseId) ?? null : null),
    [selectedUniverseId],
  );

  useEffect(() => {
    setSelectedWords([]);
    setIsSubmitting(false);
    setHoveredUniverseId(null);
  }, [selectedUniverseId]);

  useEffect(() => {
    if (selectedUniverse && isCompact) {
      const scrollTarget = cloudLayerRef.current;
      if (scrollTarget) {
        requestAnimationFrame(() => {
          scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
  }, [selectedUniverse, isCompact]);

  const shuffledWords = useMemo(
    () =>
      selectedUniverse
        ? [...selectedUniverse.words]
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(selectedUniverse.words.length, 100))
        : [],
    [selectedUniverse],
  );

  const cloudWords = useMemo(
    () => shuffledWords.filter((word) => !selectedWords.includes(word)),
    [shuffledWords, selectedWords],
  );

  const handleWordDrop = (word: string) => {
    if (!selectedUniverse) return;
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
    if (selectedUniverse && selectedWords.length === MAX_SELECTION && !loading && !isSubmitting) {
      setIsSubmitting(true);
      onSubmit({ universeId: selectedUniverse.id, words: [...selectedWords] });
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
      justifyContent: 'flex-start',
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
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 10,
    } : {
     
      margin: '',
    }),
  }), [isCompact]);

  const responsiveDropZone = useMemo(() => ({
    ...styles.dropZone,
    ...(isCompact ? {
      position: 'sticky' as const,
      bottom: 0,
    } : {
      maxWidth: 980,
      margin: '0 auto',
    }),
  }), [isCompact]);

  const instructionText = !selectedUniverse
    ? ''
    : isCompact
      ? 'Touchez 6 mots'
      : 'Sélectionnez 6 mots';
  const helperTextPrefix = isCompact ? 'Touchez' : 'Sélectionnez';
  const dropHover = !!selectedUniverse && selectedWords.length > 0 && selectedWords.length < MAX_SELECTION;

  return (
    <>
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
            style={{ ...responsiveContainer, overflow: isCompact ? 'auto' : 'hidden' }}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
          >
            <UniverseSelection
              styles={styles}
              universes={UNIVERSES}
              artMap={UNIVERSE_ART}
              defaultArt={DEFAULT_ART}
              isCompact={isCompact}
              selectedUniverse={selectedUniverse}
              selectedUniverseId={selectedUniverseId}
              hoveredUniverseId={hoveredUniverseId}
              activeCardId={activeCardId}
              onSelectUniverse={setSelectedUniverseId}
              onHoverStart={setHoveredUniverseId}
              onHoverEnd={(id) => {
                setHoveredUniverseId((prev) => (prev === id ? null : prev));
                setActiveCardId((prev) => (prev === id ? null : prev));
              }}
              onSetActiveCard={setActiveCardId}
              onRequestPreview={showImagePreview}
            />

            {selectedUniverse ? (
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
                    compact={isCompact}
                  />
                ))}
              </div>
            ) : (
              <></>
            )}
 {selectedWords.length > 0 && (
            <div
              ref={dropZoneRef}
              style={{
                ...responsiveDropZone,
                ...(dropHover ? styles.dropZoneHover : {}),
              }}
            >
              {/* {selectedWords.length === 0 && (
                <div style={{ fontWeight: 600, fontSize: 14, color: '#f5f7ff' }}>{instructionText}</div>
              )} */}

             
                <div style={{ fontSize: 12, opacity: 0.85, color: '#f5f7ff' }}>
                  {selectedWords.length < MAX_SELECTION
                    ? `${helperTextPrefix} encore ${MAX_SELECTION - selectedWords.length} mot${
                        MAX_SELECTION - selectedWords.length !== 1 ? 's' : ''
                      }.`
                    : 'Sélection complète.'}
                </div>
             
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
                    compact={isCompact}
                  />
                ))}
              </div>
            </div> )}
            {selectedWords.length === MAX_SELECTION && (
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <MagicButton onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Création...' : 'commencez.'}
                </MagicButton>
              </div>
            )}
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
      <ImagePreview image={imagePreview} onClose={hideImagePreview} />
    </>
  );
}
