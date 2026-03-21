export function makeDemoJob() {
  return {
    type: 'AGENT_EXECUTION',
    payload: {
      jobId: 1,
      milestoneId: 0,
      artifactUrl: 'ipfs://demo-artifact',
      target: 'agentcred-core-loop'
    }
  };
}
