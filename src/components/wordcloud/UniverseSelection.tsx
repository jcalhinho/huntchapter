import { AnimatePresence, motion } from 'framer-motion';
import type { UniverseConfig } from '../../lib/universes';
import { CARD_BASE_HEIGHT, CARD_EXPANDED_HEIGHT } from './config';
import type { WordCloudStyles } from './types';

export type ArtMap = Record<string, { front: string; back: string }>;

export type UniverseSelectionProps = {
  styles: WordCloudStyles;
  universes: UniverseConfig[];
  artMap: ArtMap;
  defaultArt: { front: string; back: string };
  isCompact: boolean;
  selectedUniverse: UniverseConfig | null;
  selectedUniverseId: string | null;
  hoveredUniverseId: string | null;
  activeCardId: string | null;
  onSelectUniverse: (id: string) => void;
  onHoverStart: (id: string) => void;
  onHoverEnd: (id: string) => void;
  onSetActiveCard: (id: string | null) => void;
  onRequestPreview: (src: string, alt: string) => void;
};

export default function UniverseSelection({
  styles,
  universes,
  artMap,
  defaultArt,
  isCompact,
  selectedUniverse,
  selectedUniverseId,
  hoveredUniverseId,
  activeCardId,
  onSelectUniverse,
  onHoverStart,
  onHoverEnd,
  onSetActiveCard,
  onRequestPreview,
}: UniverseSelectionProps) {
  return (
    <div style={styles.universesWrapper}>
      <AnimatePresence>
        {!selectedUniverse && (
          <motion.div
            key="hero-logo"
            style={styles.heroLogo}
            initial={{ opacity: 0, y: -18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.85 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <img src="/logo.webp" alt="HuntChapter" style={styles.heroLogoImage} />
          </motion.div>
        )}
      </AnimatePresence>
      {isCompact ? (
        <>
          <div style={styles.universeCompactGrid}>
            {universes.map((universe) => {
              const active = universe.id === selectedUniverseId;
              return (
                <button
                  key={universe.id}
                  type="button"
                  onClick={() => onSelectUniverse(universe.id)}
                  style={{
                    ...styles.universeCompactButton,
                    ...(active ? styles.universeCompactActive : {}),
                  }}
                >
                  <span style={styles.universeCompactLabel}>{universe.label}</span>
                </button>
              );
            })}
          </div>
          <div style={styles.universeCompactPrompt}>Choisissez un univers narratif</div>
        </>
      ) : (
        <>
          <div style={styles.universePrompt}>Choisissez un univers narratif</div>
          <div style={styles.universeGrid}>
            {universes.map((universe) => {
            const active = universe.id === selectedUniverseId;
            const hovered = hoveredUniverseId === universe.id;
            const flipped = activeCardId === universe.id;
            const art = artMap[universe.id] ?? defaultArt;
            const handleHoverStart = () => onHoverStart(universe.id);
            const handleHoverEnd = () => onHoverEnd(universe.id);

            return (
              <motion.div
                key={universe.id}
                layout
                role="button"
                tabIndex={0}
                onHoverStart={handleHoverStart}
                onHoverEnd={handleHoverEnd}
                onFocus={handleHoverStart}
                onBlur={handleHoverEnd}
                onClick={() => onSelectUniverse(universe.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectUniverse(universe.id);
                  }
                }}
                style={{
                  ...styles.universeCard,
                  ...(active ? styles.universeCardActive : {}),
                  overflow: hovered || flipped ? 'visible' : styles.universeCard.overflow,
                }}
                initial={false}
                animate={{
                  height: hovered ? CARD_EXPANDED_HEIGHT : CARD_BASE_HEIGHT,
                  marginBottom: hovered ? -(CARD_EXPANDED_HEIGHT - CARD_BASE_HEIGHT) : 0,
                  zIndex: hovered || flipped ? 12 : active ? 6 : 1,
                }}
                transition={{
                  layout: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] },
                  height: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] },
                  marginBottom: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] },
                }}
              >
                <motion.div style={styles.universe3dWrapper}>
                  <motion.div
                    style={{
                      ...styles.universeFace,
                      ...styles.universeFront,
                      alignItems: hovered ? 'stretch' : 'center',
                      justifyContent: hovered ? 'flex-start' : 'center',
                      textAlign: hovered ? 'left' : 'center',
                      pointerEvents: flipped ? 'none' : 'auto',
                    }}
                    initial={false}
                    animate={{
                      paddingBottom: hovered ? 26 : 24,
                      opacity: flipped ? 0 : 1,
                      rotateY: flipped ? 180 : 0,
                    }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                  >
                    <motion.span
                      style={{
                        ...styles.universeBadge,
                        fontSize: hovered ? 11.5 : 13,
                        letterSpacing: hovered ? 1.4 : 1.8,
                      }}
                      initial={false}
                      animate={{ opacity: 1, y: hovered ? 0 : 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      {universe.genre}
                    </motion.span>

                    <AnimatePresence>
                      {hovered && (
                        <motion.div
                          key="front-expanded"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                        >
                          <strong style={styles.universeTitle}>{universe.label}</strong>
                          <motion.div
                            key="more-wrapper"
                            style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 2 }}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 12 }}
                            transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
                          >
                            <button
                              type="button"
                              style={styles.universeMoreBtn}
                              onMouseEnter={() => onSetActiveCard(universe.id)}
                              onFocus={() => onSetActiveCard(universe.id)}
                              onClick={(event) => {
                                event.stopPropagation();
                                onSetActiveCard(universe.id);
                              }}
                            >
                              More…
                            </button>
                          </motion.div>
                          <motion.div
                            style={styles.universeFrontImageFrame}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.12 }}
                            whileHover={{ scale: 1.03 }}
                            onClick={(event) => {
                              event.stopPropagation();
                              onRequestPreview(art.front, universe.label);
                            }}
                          >
                            <div style={styles.universeFrontImageAspect}>
                              <motion.img
                                src={art.front}
                                alt={universe.label}
                                style={styles.universeFrontImage}
                                initial={false}
                                animate={{ scale: flipped ? 1.08 : 1 }}
                                whileHover={{ scale: 1.18 }}
                                transition={{ duration: 0.55, ease: 'easeOut' }}
                              />
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <motion.div
                    style={{
                      ...styles.universeFace,
                      ...styles.universeBack,
                      pointerEvents: flipped ? 'auto' : 'none',
                    }}
                    initial={false}
                    animate={{
                      opacity: flipped ? 1 : 0,
                      rotateY: flipped ? 0 : -180,
                    }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                  >
                    <motion.div
                      style={styles.universeBackImageFrame}
                      whileHover={{ scale: 1.03 }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRequestPreview(art.back, `${universe.label} — verso`);
                      }}
                    >
                      <motion.img
                        src={art.back}
                        alt=""
                        style={styles.universeBackImage}
                        whileHover={{ scale: 1.18 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                      />
                    </motion.div>
                    <div style={styles.universeBackText}>
                      <span style={{ fontSize: 13, opacity: 0.9 }}>{universe.description}</span>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}
