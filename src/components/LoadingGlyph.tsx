import { useEffect, useRef } from 'react';

export default function LoadingGlyph() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    const DPR = 1;
    let raf = 0, t = 0;
    const resize = () => {
      const w = c.clientWidth, h = c.clientHeight;
      c.width = w * DPR; c.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    const glyphs = '◐◓◑◒◆◇✦✧✩✪✫✬✭✮✯✰✶✷✸✹✺';
    const draw = () => {
      const w = c.width / DPR, h = c.height / DPR;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const N = 28;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 + t * 0.7;
        const r = Math.min(w, h) * 0.28 + Math.sin(t * 0.6 + i) * 4;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const size = 12 + 4 * Math.sin(t * 1.2 + i);
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t + i);
        ctx.fillStyle = `hsl(${(i * 9 + t * 40) % 360}, 80%, 60%)`;
        ctx.font = `${size}px ui-sans-serif, system-ui`;
        ctx.fillText(glyphs[i % glyphs.length], 0, 0);
        ctx.restore();
      }
      t += 0.02;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); }
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', background: 'transparent', marginBottom: 12 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', willChange: 'transform',  background: 'transparent' }} />
    </div>
  );
}
