export const metadata = {
  title: 'AgentCred',
  description: 'Verifiable Agent Reputation + Escrow Hiring Network'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, Arial, sans-serif', background: '#0b0f16', color: '#e7eefc' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: 20 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{ margin: 0 }}>AgentCred</h1>
            <small style={{ opacity: 0.8 }}>Base Sepolia • OpenServ • EigenCompute</small>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
