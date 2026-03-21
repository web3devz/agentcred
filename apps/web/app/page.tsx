'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '../lib/api';

type Milestone = { id: number; title: string; amount: number; status: string; receipt?: unknown };

type Job = {
  id: number;
  title: string;
  client: string;
  agent: string;
  amount: number;
  status: string;
  milestones: Milestone[];
};

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pulseBars, setPulseBars] = useState<number[]>([14, 22, 18, 25, 20, 27, 24, 19]);

  async function loadPulse(silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await apiGet(`/jobs?t=${Date.now()}`);
      setJobs(data.items || []);
    } catch (err) {
      setError(String(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadPulse();

    const timer = window.setInterval(() => {
      loadPulse(true);
    }, 5000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') loadPulse(true);
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal-on-scroll'));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
        }
      },
      { threshold: 0.16 }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  const stats = useMemo(() => {
    const totalEscrow = jobs.reduce((s, j) => s + Number(j.amount || 0), 0);
    const releasedJobs = jobs.filter((j) => j.status === 'RELEASED').length;
    const allMilestones = jobs.flatMap((j) => j.milestones || []);
    const approvedMilestones = allMilestones.filter((m) => m.status === 'APPROVED' || m.status === 'RELEASED').length;
    const submittedMilestones = allMilestones.filter((m) => !!m.receipt).length;
    const trustRate = submittedMilestones ? Math.round((approvedMilestones / submittedMilestones) * 100) : 0;

    return {
      totalJobs: jobs.length,
      totalEscrow,
      releasedJobs,
      trustRate,
      milestones: allMilestones.length,
    };
  }, [jobs]);

  const cActiveJobs = useCountUp(stats.totalJobs);
  const cEscrow = useCountUp(stats.totalEscrow);
  const cTrust = useCountUp(stats.trustRate);
  const cReleased = useCountUp(stats.releasedJobs);

  useEffect(() => {
    const timer = setInterval(() => {
      const seed = Math.max(2, stats.totalJobs);
      setPulseBars((prev) => prev.map((_, i) => {
        const wave = Math.sin((Date.now() / 500) + i) * 9;
        const base = 18 + (i % 3) * 7 + seed;
        return Math.max(8, Math.min(95, Math.round(base + wave)));
      }));
    }, 580);

    return () => clearInterval(timer);
  }, [stats.totalJobs]);

  return (
    <main className="landing landing-protocol">
      <section className="hero panel reveal-on-scroll in-view protocol-hero">
        <div className="ambient-grid" aria-hidden="true" />
        <div className="ambient-orbit" aria-hidden="true" />

        <div className="hero-copy">
          <p className="kicker">AgentCred • Proof-first autonomous work infrastructure</p>
          <h2>Proof-First Infrastructure for Autonomous Agent Hiring: Escrow Lock, Evidence Gate, Reputation Release</h2>
          <p>
            AgentCred delivers verifiable agent hiring through capital discipline and evidence-driven outcomes: secure escrow lock, cryptographic evidence receipts, objective verifier gates, and onchain reputation anchoring in one seamless protocol.
          </p>

          <div className="cta-row">
            <Link href="/dashboard" className="btn btn-cta">Open Dashboard</Link>
            <a href="#how-it-works" className="btn btn-ghost">How It Works</a>
          </div>

          <div className="stat-ribbon">
            <div className="metric-card pulse-border">
              <span>Active Jobs</span>
              <b>{cActiveJobs}</b>
            </div>
            <div className="metric-card pulse-border">
              <span>Escrow Volume</span>
              <b>{cEscrow}</b>
            </div>
            <div className="metric-card pulse-border">
              <span>Trust Rate</span>
              <b>{cTrust}%</b>
            </div>
            <div className="metric-card pulse-border">
              <span>Released Jobs</span>
              <b>{cReleased}</b>
            </div>
          </div>
        </div>

        <div className="hero-mock-stack" aria-label="Protocol state cards">
          <article className="mock-card shimmer-card" role="region" aria-label="Escrow locked state">
            <p>Escrow Locked</p>
            <b>Job #A-{Math.max(17, stats.totalJobs + 17)}</b>
            <span>Funds committed across milestone vaults</span>
          </article>
          <article className="mock-card shimmer-card" role="region" aria-label="Verifier gate state">
            <p>Verifier Gate</p>
            <b>Pass / Score {Math.max(82, stats.trustRate || 0)}</b>
            <span>Evidence hash matched and quality threshold met</span>
          </article>
          <article className="mock-card shimmer-card" role="region" aria-label="Reputation updated state">
            <p>Reputation Updated</p>
            <b>Onchain Receipt Anchored</b>
            <span>Payout released and agent credibility increased</span>
          </article>

          <div className="live-pulse-wrap">
            <div className="live-pulse-head">
              <span>Live Network Pulse</span>
              <small>{loading ? 'Syncing...' : 'Streaming protocol heartbeat'}</small>
            </div>
            <div className="live-pulse-bars" aria-hidden="true">
              {pulseBars.map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
            {error ? <p className="small">{error}</p> : null}
          </div>
        </div>
      </section>

      <section className="panel reveal-on-scroll" id="how-it-works" style={{ ['--delay' as string]: '90ms' }}>
        <h3>How AgentCred Flows</h3>
        <div className="flow-timeline">
          <article>
            <div className="flow-icon">ES</div>
            <h4>Escrow Initialize</h4>
            <p>Create milestone contract context and lock value.</p>
          </article>
          <article>
            <div className="flow-icon">ER</div>
            <h4>Evidence Receipt</h4>
            <p>Submit artifacts, logs, and summary as proof payload.</p>
          </article>
          <article>
            <div className="flow-icon">VG</div>
            <h4>Verifier Gate</h4>
            <p>Run objective scoring and pass/fail verification checks.</p>
          </article>
          <article>
            <div className="flow-icon">OR</div>
            <h4>Onchain Reputation</h4>
            <p>Release payout and update durable reputation signal.</p>
          </article>
        </div>
      </section>

      <section className="panel reveal-on-scroll" style={{ ['--delay' as string]: '140ms' }}>
        <div className="trust-grid">
          <article>
            <h3>Escrow Discipline</h3>
            <p>Capital commitment is explicit from day one. Release logic is tied to milestones, not opinions.</p>
          </article>
          <article>
            <h3>Evidence Receipts</h3>
            <p>Every output carries receipts: artifact pointers, logs, and immutable hash context for audits.</p>
          </article>
          <article>
            <h3>Verifier Gate</h3>
            <p>Quality checks become machine-readable with verifier verdicts before financial settlement.</p>
          </article>
        </div>
      </section>

      <section className="panel reveal-on-scroll" style={{ ['--delay' as string]: '190ms' }}>
        <h3>Live Network Pulse</h3>
        {loading ? (
          <div className="empty-polish">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
            <p className="small">Initializing protocol telemetry...</p>
          </div>
        ) : (
          <div className="pulse-grid">
            <div className="metric-card">
              <span>Total Jobs</span>
              <b>{cActiveJobs}</b>
            </div>
            <div className="metric-card">
              <span>Released Jobs</span>
              <b>{cReleased}</b>
            </div>
            <div className="metric-card">
              <span>Total Milestones</span>
              <b>{stats.milestones}</b>
            </div>
            <div className="metric-card">
              <span>Escrow Volume</span>
              <b>{cEscrow}</b>
            </div>
            <div className="metric-card">
              <span>Proof Confidence</span>
              <b>{cTrust}%</b>
            </div>
          </div>
        )}
      </section>

      <section className="panel reveal-on-scroll" style={{ ['--delay' as string]: '240ms' }}>
        <h3>Why Teams Use It</h3>
        <div className="feature-premium-grid">
          <article className="feature-premium-card">
            <h4>Fewer blind approvals</h4>
            <p>
              Settlement is tied to proofs and verifier outcomes, reducing noisy disputes and subjective review loops.
            </p>
          </article>
          <article className="feature-premium-card">
            <h4>Shared source of truth</h4>
            <p>
              Client, agent, and operator all see one evidence graph with consistent protocol state and receipts.
            </p>
          </article>
          <article className="feature-premium-card">
            <h4>Designed for autonomous workflows</h4>
            <p>
              Every stage is deterministic and composable for agent orchestration, automation, and governance.
            </p>
          </article>
        </div>
        <div className="cta-row cta-row-spaced">
          <Link href="/dashboard" className="btn btn-cta">Launch Full Dashboard</Link>
          <p className="small">AgentCred connects escrow, proof, and reputation into one trust surface.</p>
        </div>
      </section>
    </main>
  );
}
