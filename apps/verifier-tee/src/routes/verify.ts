import { computeScore } from '../scoring/index.js';

export interface VerifyInput {
	jobId: number;
	receiptHash: string;
	signalScore: number;
}

export interface VerifyResult {
	verdict: 'pass' | 'review' | 'fail';
	score: number;
	signedBy: string;
	receiptHash?: string;
}

export function verify(input: VerifyInput): VerifyResult {
	const { verdict, score, receiptHash } = computeScore(input.signalScore, input.receiptHash);
	return { verdict, score, signedBy: 'tee-service', receiptHash };
}
