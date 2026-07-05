export default function NotFound() {
  return (
    <main style={{ padding: '80px 24px', fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
      <p style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--umber-strong)' }}>404</p>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 40, margin: '10px 0 20px' }}>nothing filed here.</h1>
      <p><a href="/">back to the catalog</a></p>
    </main>
  );
}
