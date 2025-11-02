
import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// --- STYLES ---
const btnPrimary = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: 16,
  fontWeight: 600,
  color: '#0d1117',
  background: '#f0f6fc',
  border: '1px solid #d0d7de',
  borderRadius: 8,
  padding: '10px 18px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  outline: 'none',
};

// --- COMPONENT PROPS ---
interface WordCloudProps {
  onSubmit: (words: string[]) => void;
  loading: boolean;
}

// --- 3D WORD COMPONENT ---
function Word({ children, ...props }: any) {
  const [hovered, setHovered] = useState(false);
  const color = new THREE.Color();
  const fontProps = { fontSize: 2.5, letterSpacing: -0.05, lineHeight: 1, 'material-toneMapped': false }

  return (
    <Text
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      {...props}
      {...fontProps}
    >
      {children}
      <meshPhongMaterial attach="material" color={hovered ? 'red' : 'white'} />
    </Text>
  );
}

// --- MAIN WORD CLOUD COMPONENT ---
export default function WordCloud({ onSubmit, loading }: WordCloudProps) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  const words = useMemo(() => [
    // List of 50 words
    'Dragon', 'Cyberpunk', 'Mystère', 'Forêt', 'Amour', 'Guerre', 'Magie', 'Espace', 'Futur', 'Passé',
    'Enquête', 'Crime', 'Complot', 'Roi', 'Reine', 'Héro', 'Anti-héro', 'Quête', 'Artefact', 'Destin',
    'Voyage', 'Découverte', 'Perte', 'Vengeance', 'Trahison', 'Alliance', 'Royaume', 'Empire', 'Rébellion', 'Liberté',
    'Mort', 'Vie', 'Secret', 'Mensonge', 'Vérité', 'Honneur', 'Chaos', 'Ordre', 'Paix', 'Conflit',
    'Monstre', 'Dieu', 'Démon', 'Ange', 'Prophétie', 'Rituel', 'Sacrifice', 'Espoir', 'Peur', 'Courage'
  ], []);

  const handleWordClick = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else if (selectedWords.length < 6) {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const cloudRadius = 12;
  const positions = useMemo(() => {
    const temp = [];
    const spherical = new THREE.Spherical();
    for (let i = 0; i < words.length; i++) {
      const phi = Math.acos(-1 + (2 * i) / words.length);
      const theta = Math.sqrt(words.length * Math.PI) * phi;
      const position = new THREE.Vector3().setFromSpherical(spherical.set(cloudRadius, phi, theta));
      temp.push(position);
    }
    return temp;
  }, [words.length]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ width: '100%', height: '400px' }}>
            <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 35], fov: 90 }}>
                <fog attach="fog" args={['#202025', 0, 80]} />
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} />
                <group position={[0, 0, 0]}>
                    {words.map((word, i) => (
                        <Word key={i} position={positions[i]} onClick={() => handleWordClick(word)}>
                            {word}
                        </Word>
                    ))}
                </group>
            </Canvas>
        </div>
        <div style={{
            width: '100%',
            maxWidth: '600px',
            minHeight: '80px',
            border: '2px dashed #30363d',
            borderRadius: 12,
            padding: 10,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {selectedWords.map(word => <span key={word} style={{ background: '#1c2230', padding: '5px 10px', borderRadius: 6 }}>{word}</span>)}
            {selectedWords.length === 0 && <span style={{ opacity: 0.5 }}>Choisissez 6 mots pour commencer</span>}
        </div>
        {selectedWords.length === 6 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <button style={btnPrimary} onClick={() => onSubmit(selectedWords)} disabled={loading}>
                    {loading ? 'Création...' : 'Lancer l\'aventure'}
                </button>
            </motion.div>
        )}
    </div>
  );
}
