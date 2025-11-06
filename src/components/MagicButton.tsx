import { motion } from 'framer-motion';
import { optBtnBig } from '../styles/ui';

export default function MagicButton({ children, onClick, disabled }: { children: any; onClick: () => void, disabled?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      style={{...optBtnBig, ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {})}}
      whileHover={{ y: -2, scale: 1.03, boxShadow: '0 16px 42px rgba(80,120,255,0.28)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.button>
  );
}
