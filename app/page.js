export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>CA.RO Connect</h1>
      <p style={{ color: '#666' }}>Plataforma de Conversational Commerce com IA</p>
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <p>✅ Sistema online</p>
        <p>📡 Webhook: <code>/api/webhook</code></p>
        <p>💚 Health: <a href="/api/health">/api/health</a></p>
      </div>
    </main>
  )
}
