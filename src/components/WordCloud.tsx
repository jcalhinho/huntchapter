import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Shuffle words for variety
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
  },
  word: {
    padding: '8px 16px',
    margin: '8px',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s, color 0.3s',
    fontSize: '16px',
    border: '1px solid transparent',
  },
  selectedWord: {
    backgroundColor: '#61dafb',
    color: '#0b0b0f',
    borderColor: '#61dafb',
  },
  bottomControls: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  selectedWordsContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: '30px',
  },
  selectedWordPill: {
    padding: '4px 10px',
    background: '#1c2230',
    color: '#61dafb',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  }
};


// --- MAIN COMPONENT ---
export default function WordCloud({ onSubmit, loading }: { onSubmit: (words: string[]) => void, loading: boolean }) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWordClick = (word: string) => {
    if (isSubmitting) return;
    setSelectedWords(prev => {
      if (prev.includes(word)) {
        return prev.filter(w => w !== word);
      }
      if (prev.length < 6) {
        return [...prev, word];
      }
      return prev;
    });
  };

  const handleSubmit = () => {
    if (selectedWords.length === 6 && !loading) {
      setIsSubmitting(true);
      // The prop "onAnimationComplete" of Framer Motion will call onSubmit
    }
  };

  return (
    <motion.div
      animate={{ opacity: isSubmitting ? 0 : 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      onAnimationComplete={() => {
        if (isSubmitting) {
          onSubmit(selectedWords);
        }
      }}
      style={styles.container}
    >
        {shuffledWords.map(word => {
            const isSelected = selectedWords.includes(word);
            return (
                <motion.div
                    key={word}
                    style={{...styles.word, ...(isSelected ? styles.selectedWord : {})}}
                    onClick={() => handleWordClick(word)}
                    whileHover={{ scale: 1.1, borderColor: '#61dafb' }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    {word}
                </motion.div>
            )
        })}

      <div style={styles.bottomControls}>
        <div style={styles.selectedWordsContainer}>
          {selectedWords.map(word => (
            <motion.div
              key={word}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={styles.selectedWordPill}
              onClick={() => handleWordClick(word)}
            >
              {word}
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {selectedWords.length === 6 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <MagicButton onClick={handleSubmit} disabled={loading || isSubmitting}>
                {loading ? 'Création...' : 'Forger le destin'}
              </MagicButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
