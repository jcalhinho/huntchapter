export const page: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100dvh',
  overflowX: 'hidden',
  overflowY: 'auto',
  display: 'grid',
  gridTemplateColumns: '1fr',
  background:
    'radial-gradient(1200px 600px at 20% -10%, #1d2540 0%, transparent 60%), ' +
    'radial-gradient(1000px 600px at 110% 10%, #182034 0%, transparent 60%), #0b0b0f',
  color: '#fff',
};

export const rightPane: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  height: '100%',
  boxSizing: 'border-box',
};

export const topbar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 'env(safe-area-inset-top, 6px) clamp(16px, 4vw, 48px) 10px',
  borderBottom: '1px solid #1c2230',
  letterSpacing: 0.2,
  position: 'sticky',
  top: 0,
  zIndex: 20,
  background: 'rgba(11,11,15,0.8)',
  backdropFilter: 'blur(12px)',
  minHeight: 40,
  fontSize: 'clamp(14px, 2vw, 18px)',
  width: '100%',
};

export const bottombar: React.CSSProperties = {
  padding: 0,
  borderTop: 'none',
};

export const card: React.CSSProperties = {
  background: 'transparent',

};

export const contentWrap: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '24px clamp(16px, 4vw, 48px) 40px',
  boxSizing: 'border-box',
  width: '100%',
};

export const btn: React.CSSProperties = { background: '#22293a', color: '#fff', border: 'none', borderRadius: 12, padding: '8px 12px', fontSize: 'clamp(12px, 2vw, 15px)' };
export const btnPrimary: React.CSSProperties = { background: '#fff', color: '#000', border: 'none', borderRadius: 12, padding: '10px 16px' };

export const optBtnBig: React.CSSProperties = {
  backgroundImage: 'linear-gradient(135deg, #11192c 0%, #0f1b3d 50%, #1e2a4f 100%)',
  backgroundSize: '200% 200%',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '14px 16px',
  textAlign: 'left',
  transform: 'perspective(800px) rotateX(calc(var(--my, 0) * 1deg)) rotateY(calc(var(--mx, 0) * 1deg))',
};
