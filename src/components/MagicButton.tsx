import { motion } from 'framer-motion';
import { optBtnBig } from '../styles/ui';

export default function MagicButton({ children, onClick }: { children: any; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      style={optBtnBig}
      whileHover={{ y: -2, scale: 1.02, boxShadow: '0 18px 60px rgba(106,167,255,0.35)', backgroundPosition: '100% 0' }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onMouseMove={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width; const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', String((px - 0.5) * 20));
        el.style.setProperty('--my', String((py - 0.5) * -20));
      }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.setProperty('--mx','0'); el.style.setProperty('--my','0'); }}
    >
      {children}
    </motion.button>
  );
}