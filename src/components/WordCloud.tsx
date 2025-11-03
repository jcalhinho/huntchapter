import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
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
    height: '400px', // Reduced height
    position: 'relative',
    border: '1px solid #1c2230',
    background: '#0b0b0f',
    borderRadius: 12,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: '20px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    cursor: 'pointer',
    perspective: '800px', // Added for 3D effect
  },
  word: {
    padding: '8px 16px',
    margin: '8px',
    color: 'white',
    borderRadius: '8px',
    cursor: 'grab',
    fontSize: '16px',
    border: '1px solid transparent',
    userSelect: 'none',
    position: 'relative', // Needed for zIndex to work with scale
  },
  dropZoneContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  dropZone: {
    width: '80%',
    minHeight: '60px', // Use min-height to allow it to grow
    border: '2px dashed #1c2230',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap', // Allow pills to wrap
    gap: '8px',
    padding: '12px',
    color: '#343d4e',
    transition: 'border-color 0.3s, background-color 0.3s',
  },
  dropZoneHover: {
    borderColor: '#61dafb',
    backgroundColor: 'rgba(97, 218, 251, 0.1)',
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
const Word = ({ children, onDrop }: { children: string; onDrop: () => void; }) => {
  return (
    <motion.div
      style={styles.word}
      drag
      onDragEnd={(event, info) => {
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
          const { top, left, width, height } = dropZone.getBoundingClientRect();
          if (info.point.x > left && info.point.x < left + width && info.point.y > top && info.point.y < top + height) {
            onDrop();
          }
        }
      }}
      whileHover={{ scale: 1.2, z: 20 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {children}
    </motion.div>
  );
};

// --- DROP ZONE COMPONENT ---
const DropZone = ({ selectedWords }: { selectedWords: string[] }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            id="drop-zone"
            style={{...styles.dropZone, ...(isHovered ? styles.dropZoneHover : {})}}
            onDragOver={(e) => { e.preventDefault(); setIsHovered(true); }}
            onDragLeave={() => setIsHovered(false)}
            onDrop={() => setIsHovered(false)}
        >
            {selectedWords.length > 0 ? (
                selectedWords.map(word => <div key={word} style={styles.selectedWordPill}>{word}</div>)
            ) : (
                "Glissez jusqu'à 6 mots ici"
            )}
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function WordCloud({ onSubmit, loading }: { onSubmit: (words: string[]) => void, loading: boolean }) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [0, 400], [25, -25]);
  const rotateY = useTransform(x, [0, 800], [-25, 25]);

  function handleMouse(event: React.MouseEvent) {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      x.set(event.clientX - rect.left);
      y.set(event.clientY - rect.top);
    }
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
            style={{ ...styles.container, rotateX, rotateY }}
            onMouseMove={handleMouse}
          >
            {shuffledWords.filter(w => !selectedWords.includes(w)).map(word => (
              <Word
                key={word}
                onDrop={() => handleWordDrop(word)}
              >
                {word}
              </Word>
            ))}
          </motion.div>

          <div style={styles.dropZoneContainer}>
            <DropZone selectedWords={selectedWords} />

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
