import './globals.css';
import Link from 'next/link';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata = {
  title: 'AgentCred',
  description: 'Verifiable Agent Reputation + Escrow Hiring Network',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${display.variable} ${mono.variable}`}>
        <div className="app-shell">
          <div className="global-ambient" aria-hidden="true" />
          <header className="header">
            <div className="brand-wrap">
              <h1 className="title brand-title">
                <span className="brand-mark">AC</span>
                <span>AgentCred</span>
              </h1>
              <p className="subtitle">Verifiable agent reputation + escrow hiring network</p>
            </div>
            <div className="header-right">
              <nav className="nav-links" aria-label="Primary">
                <Link href="/">Landing</Link>
                <Link href="/dashboard">Dashboard</Link>
              </nav>
              <div className="badges">
                <span className="badge">Base Sepolia</span>
                <span className="badge">OpenServ</span>
                <span className="badge">EigenCompute</span>
              </div>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
