export const JobCreateSchema = {
  required: ['title', 'client', 'agent', 'amount'],
} as const;

export const ReceiptSchema = {
  required: ['artifactUrl', 'summary'],
} as const;

export const VerifierRequestSchema = {
  required: ['jobId', 'receiptHash', 'signalScore'],
} as const;

export const VerifierResultSchema = {
  required: ['verdict', 'score', 'signedBy'],
} as const;
