export const VerifierRequestSchema = {
  required: ['jobId', 'receiptHash', 'signalScore'],
};

export function requireFields(schema, body = {}) {
  const missing = schema.required.filter((k) => body[k] === undefined || body[k] === null || body[k] === '');
  return { ok: missing.length === 0, missing };
}
