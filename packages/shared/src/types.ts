export type JobStatus =
  | 'FUNDED'
  | 'COMPLETED'
  | 'APPROVED'
  | 'REVIEW'
  | 'RELEASED'
  | 'DISPUTED';

export interface Milestone {
  id: number;
  title: string;
  amount: number;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED';
}

export interface Receipt {
  artifactUrl: string;
  summary: string;
  logs: string[];
  submittedAt: string;
  hash: string;
}

export interface VerifierResult {
  verdict: 'pass' | 'review' | 'fail';
  score: number;
  signedBy: string;
  receiptHash?: string;
}

export interface Job {
  id: number;
  title: string;
  client: string;
  agent: string;
  amount: number;
  status: JobStatus;
  milestones: Milestone[];
  receipt: Receipt | null;
  score: number | null;
  verdict: VerifierResult['verdict'] | null;
  releasedAt: string | null;
  createdAt: string;
}
