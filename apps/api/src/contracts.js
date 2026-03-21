export const JobCreateSchema = {
  required: ['title', 'client', 'agent', 'amount'],
};

export const ReceiptSchema = {
  required: ['summary'],
};

export const VerifierRequestSchema = {
  required: ['jobId', 'receiptHash', 'signalScore'],
};

export const VerifierResultSchema = {
  required: ['verdict', 'score', 'signedBy'],
};

export function requireFields(schema, body = {}) {
  const missing = schema.required.filter((k) => body[k] === undefined || body[k] === null || body[k] === '');
  return { ok: missing.length === 0, missing };
}
