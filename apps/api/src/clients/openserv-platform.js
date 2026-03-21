import { PlatformClient } from '@openserv-labs/client';
import fs from 'node:fs';
import path from 'node:path';

const STATE_FILE = path.resolve(process.cwd(), '.runtime/openserv-state.json');

const state = {
  ready: false,
  agentId: null,
  workflowId: null,
  triggerId: null,
  triggerToken: null,
  webhookUrl: null,
  initializedAt: null,
  source: 'memory',
};

function configured() {
  return Boolean(process.env.PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY || process.env.OPENSERV_USER_API_KEY);
}

function applyState(partial, source = 'memory') {
  state.ready = Boolean(partial?.triggerToken || partial?.webhookUrl);
  state.agentId = partial?.agentId ?? null;
  state.workflowId = partial?.workflowId ?? null;
  state.triggerId = partial?.triggerId ?? null;
  state.triggerToken = partial?.triggerToken ?? null;
  state.webhookUrl = partial?.webhookUrl || (partial?.triggerToken ? `https://api.openserv.ai/webhooks/trigger/${partial.triggerToken}` : null);
  state.initializedAt = partial?.initializedAt || new Date().toISOString();
  state.source = source;
}

function loadStateFromEnv() {
  if (!process.env.OPENSERV_TRIGGER_TOKEN && !process.env.OPENSERV_WEBHOOK_URL) return false;
  applyState({
    agentId: process.env.OPENSERV_AGENT_ID ? Number(process.env.OPENSERV_AGENT_ID) : null,
    workflowId: process.env.OPENSERV_WORKFLOW_ID ? Number(process.env.OPENSERV_WORKFLOW_ID) : null,
    triggerId: process.env.OPENSERV_TRIGGER_ID || null,
    triggerToken: process.env.OPENSERV_TRIGGER_TOKEN || null,
    webhookUrl: process.env.OPENSERV_WEBHOOK_URL || null,
    initializedAt: new Date().toISOString(),
  }, 'env');
  return true;
}

function loadStateFromFile() {
  try {
    if (!fs.existsSync(STATE_FILE)) return false;
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed?.triggerToken && !parsed?.webhookUrl) return false;
    applyState(parsed, 'file');
    return true;
  } catch {
    return false;
  }
}

function saveStateToFile() {
  try {
    const dir = path.dirname(STATE_FILE);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({
      agentId: state.agentId,
      workflowId: state.workflowId,
      triggerId: state.triggerId,
      triggerToken: state.triggerToken,
      webhookUrl: state.webhookUrl,
      initializedAt: state.initializedAt,
    }, null, 2));
  } catch {
    // non-fatal
  }
}

function getClient() {
  const client = process.env.OPENSERV_USER_API_KEY
    ? new PlatformClient({ apiKey: process.env.OPENSERV_USER_API_KEY })
    : new PlatformClient();
  return client;
}

async function authenticateIfNeeded(client) {
  if (!process.env.OPENSERV_USER_API_KEY) {
    const key = process.env.WALLET_PRIVATE_KEY || process.env.PRIVATE_KEY;
    await client.authenticate(key);
  }
}

export async function ensureOpenServWorkflow() {
  if (!configured()) throw new Error('openserv_platform_not_configured');
  if (state.ready) return state;

  if (loadStateFromEnv() || loadStateFromFile()) {
    return state;
  }

  const client = getClient();
  await authenticateIfNeeded(client);

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

  applyState({
    agentId: agent.id,
    workflowId: workflow.id,
    triggerId: trigger.id,
    triggerToken: trigger.token,
    webhookUrl: `https://api.openserv.ai/webhooks/trigger/${trigger.token}`,
    initializedAt: new Date().toISOString(),
  }, 'created');
  saveStateToFile();

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
