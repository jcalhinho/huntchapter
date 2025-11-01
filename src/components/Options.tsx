// Options.tsx
export default function Options<T extends string>({ current, setCurrent, items }: { current: T; setCurrent: (v: T) => void; items: T[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map((it) => (
        <button key={it} onClick={() => setCurrent(it)} style={{ ...chip, ...(current === it ? chipActive : {}) }}>{it}</button>
      ))}
    </div>
  );
}

// styles “inline” requis :
const chip: React.CSSProperties = { background: '#121726', color: '#fff', border: '1px solid #1f2940', borderRadius: 999, padding: '8px 12px' };
const chipActive: React.CSSProperties = { background: '#fff', color: '#000', borderColor: '#fff' };