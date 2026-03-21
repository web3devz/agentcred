import { PlatformClient } from '@openserv-labs/client';

const state = {
  ready: false,
  agentId: null,
  workflowId: null,
  triggerId: null,
  triggerToken: null,
  webhookUrl: null,
  initializedAt: null,
};

function configured() {
  return Boolean(process.env.PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY || process.env.OPENSERV_USER_API_KEY);
}

export async function ensureOpenServWorkflow() {
  if (!configured()) throw new Error('openserv_platform_not_configured');
  if (state.ready) return state;

  const client = process.env.OPENSERV_USER_API_KEY
    ? new PlatformClient({ apiKey: process.env.OPENSERV_USER_API_KEY })
    : new PlatformClient();

  if (!process.env.OPENSERV_USER_API_KEY) {
    const key = process.env.WALLET_PRIVATE_KEY || process.env.PRIVATE_KEY;
    await client.authenticate(key);
  }

  const agent = await client.agents.create({
    name: `agentcred-api-${Date.now()}`,
    capabilities_description: 'AgentCred secure orchestration agent',
    endpoint_url: process.env.OPENSERV_ENDPOINT_URL || 'https://agentcred.local/api'
  });

  const workflow = await client.workflows.create({
    name: `AgentCred Verification Workflow ${Date.now()}`,
    goal: 'Process, verify, and score agent job receipts',
    agentIds: [agent.id]
  });

  const connId = await client.integrations.getOrCreateConnection('webhook-trigger');
  const trigger = await client.triggers.create({
    workflowId: workflow.id,
    name: 'AgentCred API Trigger',
    integrationConnectionId: connId,
    props: {
      waitForCompletion: false,
      timeout: 120,
      inputSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          logs: { type: 'array', items: { type: 'string' } }
        },
        required: ['title', 'summary']
      }
    }
  });

  await client.tasks.create({
    workflowId: workflow.id,
    agentId: agent.id,
    description: 'Evaluate receipt and return score',
    body: 'Use available context to score confidence and quality.'
  });

  await client.triggers.activate({ workflowId: workflow.id, id: trigger.id });
  await workflow.setRunning();

  state.ready = true;
  state.agentId = agent.id;
  state.workflowId = workflow.id;
  state.triggerId = trigger.id;
  state.triggerToken = trigger.token;
  state.webhookUrl = `https://api.openserv.ai/webhooks/trigger/${trigger.token}`;
  state.initializedAt = new Date().toISOString();

  return state;
}

export async function runOpenServWorkflow(input) {
  const st = await ensureOpenServWorkflow();

  const res = await fetch(st.webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ input })
  });

  const text = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch {}

  return {
    ok: res.ok,
    status: res.status,
    workflowId: st.workflowId,
    triggerId: st.triggerId,
    webhookUrl: st.webhookUrl,
    response: parsed || text,
  };
}

export function getOpenServState() {
  return { ...state };
}
