export const page: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100dvh',
  overflow: 'hidden',
  display: 'grid',
  gridTemplateColumns: '1fr',
  background:
    'radial-gradient(1200px 600px at 20% -10%, #1d2540 0%, transparent 60%), ' +
    'radial-gradient(1000px 600px at 110% 10%, #182034 0%, transparent 60%), #0b0b0f',
  color: '#fff',
};

export const rightPane: React.CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' };

export const topbar: React.CSSProperties = {
  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '20px 24px',
  borderBottom: '1px solid #1c2230', letterSpacing: 0.2,
};

export const bottombar: React.CSSProperties = { padding: 16, borderTop: '1px solid #1c2230' };

export const card: React.CSSProperties = {
  background: '#0f1218',
  border: '1px solid #1c2230',
  borderRadius: 16,
  padding: 'clamp(16px, 2.2vw, 28px)',
  width: 'min(1100px, 92vw)',
  boxShadow: '0 20px 60px rgba(0,0,0,.5)',
};

export const btn: React.CSSProperties = { background: '#22293a', color: '#fff', border: '1px solid #2a344e', borderRadius: 12, padding: '10px 14px' };
export const btnPrimary: React.CSSProperties = { background: '#fff', color: '#000', border: 'none', borderRadius: 12, padding: '10px 16px' };

export const optBtnBig: React.CSSProperties = {
  backgroundImage: 'linear-gradient(135deg, #11192c 0%, #0f1b3d 50%, #1e2a4f 100%)',
  backgroundSize: '200% 200%',
  color: '#fff',
  border: '1px solid #1f2940',
  borderRadius: 14,
  padding: '14px 16px',
  textAlign: 'left',
  transform: 'perspective(800px) rotateX(calc(var(--my, 0) * 1deg)) rotateY(calc(var(--mx, 0) * 1deg))',
};