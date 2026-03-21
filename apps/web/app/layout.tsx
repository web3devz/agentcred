import './globals.css';

export const metadata = {
  title: 'AgentCred',
  description: 'Verifiable Agent Reputation + Escrow Hiring Network'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="header">
            <div>
              <h1 className="title">AgentCred</h1>
              <p className="subtitle">Verifiable agent reputation + escrow hiring network</p>
            </div>
            <div className="badges">
              <span className="badge">Base Sepolia</span>
              <span className="badge">OpenServ</span>
              <span className="badge">EigenCompute</span>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
