export type VerifierVerdict = 'pass' | 'review' | 'fail';

export function computeScore(signalScore: number, receiptHash?: string): { verdict: VerifierVerdict; score: number; receiptHash?: string } {
	const score = Math.min(100, Math.max(0, Math.round(Number(signalScore) || 0)));
	const verdict: VerifierVerdict = score >= 70 ? 'pass' : score >= 50 ? 'review' : 'fail';
	return { verdict, score, receiptHash };
}
