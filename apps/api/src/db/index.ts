export type JobRecord = Record<string, unknown>;
export interface DbState {
	jobs: Map<number, JobRecord>;
	reputation: Map<string, number>;
}

export function createInMemoryDb(): DbState {
	return { jobs: new Map(), reputation: new Map() };
}
