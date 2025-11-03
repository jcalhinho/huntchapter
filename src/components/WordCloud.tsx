import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
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
  container: {
    width: '100%',
    height: '500px',
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
    cursor: 'none',
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
  },
  dropZone: {
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    height: '60px',
    border: '2px dashed #1c2230',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
    margin: '0 4px',
  },
  cursor: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '2px solid #61dafb',
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 9999,
  }
};

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.05,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: [0.76, 0, 0.24, 1],
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8 },
};

// --- WORD COMPONENT ---
const Word = ({ children, onDrop, mousePosition }: { children: string; onDrop: () => void; mousePosition: { x: number | null, y: number | null } }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y } = useSpring({ x: 0, y: 0, stiffness: 150, damping: 15, mass: 0.1 });

  useEffect(() => {
    if (ref.current && mousePosition.x !== null && mousePosition.y !== null) {
      const rect = ref.current.getBoundingClientRect();
      const distance = Math.sqrt(Math.pow(rect.x + rect.width / 2 - mousePosition.x, 2) + Math.pow(rect.y + rect.height / 2 - mousePosition.y, 2));

      if (distance < 100) {
        const angle = Math.atan2((rect.y + rect.height / 2) - mousePosition.y, (rect.x + rect.width / 2) - mousePosition.x);
        x.set(Math.cos(angle) * 50);
        y.set(Math.sin(angle) * 50);
      } else {
        x.set(0);
        y.set(0);
      }
    } else {
      x.set(0);
      y.set(0);
    }
  }, [mousePosition]);

  return (
    <motion.div
      ref={ref}
      style={{ ...styles.word, x, y }}
      drag
      dragSnapToCenter
      onDragEnd={(event, info) => {
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
          const { top, left, width, height } = dropZone.getBoundingClientRect();
          if (info.point.x > left && info.point.x < left + width && info.point.y > top && info.point.y < top + height) {
            onDrop();
          }
        }
      }}
      variants={wordVariants}
    >
      {children}
    </motion.div>
  );
};

// --- DROP ZONE COMPONENT ---
const DropZone = ({ selectedWords }: { selectedWords: string[] }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <motion.div
            id="drop-zone"
            style={{...styles.dropZone, ...(isHovered ? styles.dropZoneHover : {})}}
            onDragOver={(e) => {
                e.preventDefault();
                setIsHovered(true);
            }}
            onDragLeave={() => setIsHovered(false)}
            onDrop={() => setIsHovered(false)}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        >
            {selectedWords.length > 0 ? (
                selectedWords.map(word => <motion.div key={word} style={styles.selectedWordPill} layout>{word}</motion.div>)
            ) : (
                "Glissez 6 mots ici"
            )}
        </motion.div>
    );
}

// --- MAIN COMPONENT ---
export default function WordCloud({ onSubmit, loading }: { onSubmit: (words: string[]) => void, loading: boolean }) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mousePosition, setMousePosition] = useState<{x: number | null, y: number | null}>({ x: null, y: null });

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };
   const handleMouseLeave = () => {
    setMousePosition({ x: null, y: null });
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
        <motion.div
          style={styles.container}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <AnimatePresence>
            {mousePosition.x !== null && (
              <motion.div
                style={{...styles.cursor, left: mousePosition.x - 15, top: mousePosition.y - 15}}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>

          {shuffledWords.filter(w => !selectedWords.includes(w)).map(word => (
            <Word
              key={word}
              onDrop={() => handleWordDrop(word)}
              mousePosition={mousePosition}
            >
              {word}
            </Word>
          ))}

          <DropZone selectedWords={selectedWords} />

          <AnimatePresence>
            {selectedWords.length === 6 && (
              <motion.div
                style={{ position: 'absolute', bottom: '20px' }}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <MagicButton onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Création...' : 'Forger le destin'}
                </MagicButton>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
