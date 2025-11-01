// Field.tsx
export default function Field({ label, children }: { label: string; children: any }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ opacity: 0.85 }}>{label}</span>
      {children}
    </label>
  );
}