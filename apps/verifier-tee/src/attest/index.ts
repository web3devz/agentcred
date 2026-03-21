export type Attestation = {
	ok: boolean;
	proof?: string;
	reason?: string;
};

export function verifyAttestation(_: unknown): Attestation {
	return { ok: true };
}
