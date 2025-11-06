import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

type CursorVariant = 'default' | 'project' | 'contact';

type CursorState = {
  variant: CursorVariant;
  text: string;
};

const baseStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  borderRadius: 999,
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  pointerEvents: 'none',
  mixBlendMode: 'screen',
  zIndex: 9999,
  filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.6))',
};

export default function MagicCursor() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [state, setState] = useState<CursorState>({ variant: 'default', text: '' });
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const pendingCoords = useRef(coords);

  const scheduleCoordsUpdate = (x: number, y: number) => {
    pendingCoords.current = { x, y };
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      setCoords(pendingCoords.current);
      rafRef.current = null;
    });
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') {
        setVisible(false);
        return;
      }
      setVisible(true);
      scheduleCoordsUpdate(event.clientX, event.clientY);
    };

    const handlePointerLeave = () => setVisible(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const element = target?.closest<HTMLElement>('[data-cursor]');
      if (element) {
        const requested = (element.getAttribute('data-cursor') ?? 'default') as CursorVariant;
        const text = element.getAttribute('data-cursor-text') ?? '';
        setState({ variant: requested, text });
      } else {
        setState({ variant: 'default', text: '' });
      }
    };

    document.addEventListener('pointerover', handlePointerOver, true);
    return () => {
      document.removeEventListener('pointerover', handlePointerOver, true);
    };
  }, []);

  const variants: Variants = useMemo(() => {
    const defaultSize = 10;
    const baseTransition = { type: 'spring', stiffness: 260, damping: 22, mass: 0.35 };
    return {
      default: {
        opacity: visible ? 1 : 0,
        height: defaultSize,
        width: defaultSize,
        borderRadius: defaultSize,
        backgroundColor: 'rgba(255,255,255,0.95)',
        color: '#000',
        fontSize: '10px',
        x: coords.x - defaultSize / 2,
        y: coords.y - defaultSize / 2,
        boxShadow: '0 0 12px rgba(255,255,255,0.8), 0 0 40px rgba(150,200,255,0.35)',
        transition: baseTransition,
      },
      project: {
        opacity: visible ? 1 : 0,
        height: 54,
        width: 54,
        borderRadius: 27,
        backgroundColor: '#ffffff',
        color: '#111',
        fontSize: '18px',
        x: coords.x - 38,
        y: coords.y - 38,
        transition: baseTransition,
      },
      contact: {
        opacity: visible ? 1 : 0,
        height: 40,
        width: 40,
        borderRadius: 20,
        backgroundColor: '#FFBCBC',
        color: '#000',
        fontSize: '26px',
        x: coords.x - 32,
        y: coords.y - 32,
        transition: baseTransition,
      },
    };
  }, [coords.x, coords.y, visible]);

  const trailStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 3,
    height: 3,
    borderRadius: 999,
    pointerEvents: 'none',
    background: 'rgba(255,255,255,0.5)',
    boxShadow: '0 0 15px rgba(255,255,255,0.8)',
  };

  const trailVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: visible ? [0, 1, 0] : 0,
      scale: [0.4, 1, 0.2],
      x: coords.x - 2,
      y: coords.y - 2,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <>
      <motion.div
        className="magic-cursor"
        variants={variants}
        animate={state.variant}
        style={baseStyle}
      >
        <span style={{ pointerEvents: 'none' }}>{state.text}</span>
      </motion.div>
      <motion.div
        style={trailStyle}
        variants={trailVariants}
        initial="initial"
        animate="animate"
      />
    </>
  );
}
