import type React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type PreviewImage = { src: string; alt: string } | null;

export default function ImagePreview({ image, onClose }: { image: PreviewImage; onClose: () => void }) {
  return (
    <AnimatePresence>
      {image && (
        <motion.div
          key="preview-overlay"
          style={overlayStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            style={frameStyle}
            initial={{ scale: 0.92, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
          >
            <img src={image.src} alt={image.alt} style={imageStyle} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'auto',
  zIndex: 2000,
  background: 'radial-gradient(circle at 50% 50%, rgba(8,12,24,0.35) 0%, rgba(5,6,12,0.75) 55%, rgba(5,6,12,0.92) 100%)',
};

const frameStyle: React.CSSProperties = {
  width: 'min(80vw, 640px)',
  maxHeight: 'min(72vh, 540px)',
  borderRadius: 28,
  overflow: 'hidden',
  border: '1px solid rgba(118,140,220,0.4)',
  boxShadow: '0 40px 120px rgba(5,8,18,0.65)',
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};
