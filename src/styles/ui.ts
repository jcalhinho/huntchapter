export const page = {
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100dvh',
  overflowX: 'hidden',
  overflowY: 'auto',
  display: 'grid',
  gridTemplateColumns: '1fr',
  color: '#fff',
  '--g1x': '-12%',
  '--g1y': '-12%',
  '--g2x': '112%',
  '--g2y': '-10%',
  '--g3x': '-10%',
  '--g3y': '112%',
  '--g4x': '114%',
  '--g4y': '110%',
  '--flareX': '60%',
  '--flareY': '20%',
  '--flareOpacity': '0',
  '--pulseScale': '38%',
  '--pulseOpacity': '0.18',
  '--pulseX': '50%',
  '--pulseY': '48%',
  background:
    'radial-gradient(1200px 620px at var(--g1x) var(--g1y), rgba(48,68,122,0.75) 0%, transparent 68%), ' +
    'radial-gradient(1200px 620px at var(--g2x) var(--g2y), rgba(44,58,108,0.7) 0%, transparent 68%), ' +
    'radial-gradient(1000px 620px at var(--g3x) var(--g3y), rgba(30,42,90,0.62) 0%, transparent 72%), ' +
    'radial-gradient(1000px 620px at var(--g4x) var(--g4y), rgba(32,44,96,0.6) 0%, transparent 72%), ' +
    'radial-gradient(var(--pulseScale) var(--pulseScale) at var(--pulseX, 50%) var(--pulseY, 48%), rgba(255,204,110, calc(var(--pulseOpacity) * 0.82)) 0%, rgba(255,144,52, calc(var(--pulseOpacity) * 0.54)) 38%, rgba(40,14,4,0) 68%), ' +
    'radial-gradient(780px 520px at var(--flareX) var(--flareY), rgba(255,176,120,calc(var(--flareOpacity) * 0.6)) 0%, rgba(255,176,120,calc(var(--flareOpacity) * 0.2)) 32%, transparent 72%), ' +
    '#05060c',
} as React.CSSProperties;

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
  
  padding: '10px 10px',
  borderBottom: '1px solid #1c2230',
  letterSpacing: 0.2,
  position: 'sticky',
  top: 0,
  zIndex: 20,
  background: 'rgba(11,11,15,0.8)',
  backdropFilter: 'blur(12px)',
  
  fontSize: 'clamp(14px, 2vw, 18px)',
  justifyContent: 'space-between',
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
  background: 'linear-gradient(135deg, #11192c 0%, #182b5b 100%)',
  color: '#fff',
  border: '1px solid rgba(90, 120, 220, 0.25)',
  borderRadius: 14,
  padding: '14px 16px',
  textAlign: 'left',
  boxShadow: '0 8px 24px rgba(8, 16, 36, 0.45)',
  transition: 'transform 0.25s ease, box-shadow 0.25s ease, background 0.3s ease',
}; 

export const engineBadge: React.CSSProperties = {
  position: 'fixed',
  left: 16,
  bottom: 16,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: 14,
  background: 'rgba(16, 20, 32, 0.78)',
  color: '#f5f7ff',
  fontSize: 13,
  letterSpacing: 0.3,
  border: '1px solid rgba(88, 120, 188, 0.35)',
  backdropFilter: 'blur(10px)',
  zIndex: 99,
};

export const engineBadgeDot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  boxShadow: '0 0 14px currentColor',
};
