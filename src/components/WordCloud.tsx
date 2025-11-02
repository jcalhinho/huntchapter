import { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
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
const wordCount = 50;
const radius = 10; // Augmenté pour plus d'espacement
const fontSize = 0.55; // Légèrement réduit pour une meilleure lisibilité
const font = '/fonts/Inter-Bold.woff';

// --- 3D WORD COMPONENT ---
function Word({ children, ...props }: any) {
  const color = new THREE.Color();
  const ref = useRef<any>();
  const [hovered, setHovered] = useState(false);
  const over = (e: any) => { e.stopPropagation(); setHovered(true); };
  const out = () => setHovered(false);

  useFrame(({ camera }) => {
    if (ref.current) {
      ref.current.quaternion.copy(camera.quaternion);
      ref.current.material.color.lerp(color.set(hovered ? '#61dafb' : 'white'), 0.1);
    }
  });

  return <Text ref={ref} onPointerOver={over} onPointerOut={out} {...props} font={font} fontSize={fontSize} letterSpacing={-0.05}>{children}</Text>;
}

// --- 3D CLOUD COMPONENT ---
function Cloud({ count, radius, onWordClick }: { count: number, radius: number, onWordClick: (word: string) => void }) {
  const words = useMemo(() => {
    const temp = [];
    const spherical = new THREE.Spherical();
    const phiSpan = Math.PI / (count + 1);
    const thetaSpan = (Math.PI * 2) / count;
    for (let i = 1; i < count + 1; i++) {
      for (let j = 0; j < count; j++) {
        const phi = phiSpan * i;
        const theta = thetaSpan * j;
        const word = wordsList[Math.floor(Math.random() * wordsList.length)];
        temp.push([new THREE.Vector3().setFromSpherical(spherical.set(radius, phi, theta)), word]);
      }
    }
    return temp.slice(0, count);
  }, [count, radius]);

  return (
    <>
      {words.map(([pos, word], index) => (
        <Word key={index} position={pos as any} onClick={() => onWordClick(word as string)}>
          {word as string}
        </Word>
      ))}
    </>
  );
}

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
      // La prop "onAnimationComplete" de Framer Motion appellera onSubmit
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
      style={{ width: '100%', height: '500px', position: 'relative', border: '1px solid #1c2230', background: '#0b0b0f', borderRadius: 12 }}
    >
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 18], fov: 50 }}>
        <fog attach="fog" args={['#0b0b0f', 0, 28]} />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 15]} intensity={0.8} color="#88d1ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff88c2" />
        <Cloud count={wordCount} radius={radius} onWordClick={handleWordClick} />
        <OrbitControls autoRotate autoRotateSpeed={0.2} enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.2} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
      <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', minHeight: '30px' }}>
          {selectedWords.map(word => (
            <motion.div
              key={word}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ padding: '4px 10px', background: '#1c2230', color: '#61dafb', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
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
