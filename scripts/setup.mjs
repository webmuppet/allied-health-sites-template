#!/usr/bin/env node
/**
 * Allied Health Sites — Client Setup Script
 *
 * Usage:
 *   SANITY_TOKEN=sk... GH_TOKEN=ghp... CF_API_TOKEN=cfut... \
 *   node scripts/setup.mjs \
 *     --client-slug    acme-chiro          \
 *     --sanity-project lo60cika            \
 *     --sanity-dataset production          \
 *     --cf-account     69ba917b...         \
 *     --cf-pages-name  acme-chiro-site     \
 *     --github-repo    webmuppet/acme-chiro
 *
 * What it does:
 *   1. Adds GitHub Actions secrets to the repo
 *   2. Deploys the Sanity→GitHub relay Worker to CF
 *   3. Wires the GH_TOKEN + GH_REPO secrets into the Worker
 *   4. Creates the Sanity webhook pointing at the Worker
 */

import { parseArgs } from 'util';

const { values } = parseArgs({
  options: {
    'client-slug':    { type: 'string' },
    'sanity-project': { type: 'string' },
    'sanity-dataset': { type: 'string', default: 'production' },
    'cf-account':     { type: 'string' },
    'cf-pages-name':  { type: 'string' },
    'github-repo':    { type: 'string' },
  },
});

const SANITY_TOKEN  = process.env.SANITY_TOKEN;
const GH_TOKEN      = process.env.GH_TOKEN;
const CF_API_TOKEN  = process.env.CF_API_TOKEN;

const slug          = values['client-slug'];
const sanityProject = values['sanity-project'];
const sanityDataset = values['sanity-dataset'];
const cfAccount     = values['cf-account'];
const cfPagesName   = values['cf-pages-name'];
const githubRepo    = values['github-repo'];

// ── Validation ──────────────────────────────────────────────────────────────

const missing = [];
if (!SANITY_TOKEN)  missing.push('SANITY_TOKEN env var');
if (!GH_TOKEN)      missing.push('GH_TOKEN env var');
if (!CF_API_TOKEN)  missing.push('CF_API_TOKEN env var');
if (!slug)          missing.push('--client-slug');
if (!sanityProject) missing.push('--sanity-project');
if (!cfAccount)     missing.push('--cf-account');
if (!cfPagesName)   missing.push('--cf-pages-name');
if (!githubRepo)    missing.push('--github-repo');

if (missing.length) {
  console.error('\n❌  Missing required inputs:\n');
  missing.forEach(m => console.error(`   • ${m}`));
  console.error('\nRun with --help to see usage.\n');
  process.exit(1);
}

const workerName = `${slug}-sanity-relay`;
const log = (msg) => console.log(`\n→ ${msg}`);
const ok  = (msg) => console.log(`  ✓ ${msg}`);
const err = (msg) => { console.error(`  ✗ ${msg}`); process.exit(1); };

// ── Helpers ─────────────────────────────────────────────────────────────────

async function ghApi(path, method = 'GET', body = null) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${GH_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'allied-health-setup',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function cfApi(path, method = 'GET', body = null) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function sanityApi(path, method = 'GET', body = null) {
  const res = await fetch(`https://api.sanity.io/v2022-11-15${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${SANITY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ── Step 1: GitHub Secrets ───────────────────────────────────────────────────

log('Setting GitHub Actions secrets...');

// Get repo public key for secret encryption
const { body: keyData } = await ghApi(`/repos/${githubRepo}/actions/public-key`);
if (!keyData?.key) err('Could not fetch GitHub repo public key. Check GH_TOKEN has repo scope.');

// GitHub secrets require sodium encryption — use gh CLI for simplicity
const { execSync } = await import('child_process');

const secrets = {
  CLOUDFLARE_API_TOKEN:    CF_API_TOKEN,
  CLOUDFLARE_ACCOUNT_ID:   cfAccount,
  CF_PAGES_PROJECT_NAME:   cfPagesName,
  PUBLIC_SANITY_PROJECT_ID: sanityProject,
  PUBLIC_SANITY_DATASET:   sanityDataset,
};

for (const [name, value] of Object.entries(secrets)) {
  try {
    execSync(
      `GH_TOKEN=${GH_TOKEN} gh secret set ${name} --repo ${githubRepo} --body "${value}"`,
      { stdio: 'pipe' }
    );
    ok(name);
  } catch (e) {
    err(`Failed to set secret ${name}: ${e.message}`);
  }
}

// ── Step 2: Deploy Worker ────────────────────────────────────────────────────

log(`Deploying relay Worker (${workerName})...`);

const workerScript = `
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const response = await fetch(
      \`https://api.github.com/repos/\${env.GH_REPO}/actions/workflows/deploy.yml/dispatches\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${env.GH_TOKEN}\`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'sanity-deploy-relay',
        },
        body: JSON.stringify({ ref: 'main', inputs: { reason: 'sanity-publish' } }),
      }
    );
    const text = await response.text();
    return new Response(
      response.status === 204 ? 'Build triggered' : \`GitHub error: \${text}\`,
      { status: response.status === 204 ? 200 : 500 }
    );
  },
};
`;

const deployResult = await cfApi(
  `/accounts/${cfAccount}/workers/scripts/${workerName}`,
  'PUT',
  { script: workerScript, bindings: [], compatibility_date: '2025-06-01' }
);

// CF Workers script upload uses multipart form — use wrangler CLI instead
try {
  const workerFile = new URL('../webhook-relay/index.js', import.meta.url).pathname;
  execSync(
    `CLOUDFLARE_API_TOKEN=${CF_API_TOKEN} CLOUDFLARE_ACCOUNT_ID=${cfAccount} ` +
    `bunx wrangler deploy ${workerFile} --name ${workerName} --compatibility-date 2025-06-01`,
    { stdio: 'pipe' }
  );
  ok(`Worker deployed: https://${workerName}.workers.dev`);
} catch (e) {
  err(`Worker deploy failed: ${e.stderr?.toString() ?? e.message}`);
}

// ── Step 3: Worker Secrets ───────────────────────────────────────────────────

log('Setting Worker secrets...');

for (const [name, value] of [['GH_TOKEN', GH_TOKEN], ['GH_REPO', githubRepo]]) {
  try {
    execSync(
      `echo "${value}" | CLOUDFLARE_API_TOKEN=${CF_API_TOKEN} CLOUDFLARE_ACCOUNT_ID=${cfAccount} ` +
      `bunx wrangler secret put ${name} --name ${workerName}`,
      { stdio: 'pipe' }
    );
    ok(`Worker secret set: ${name}`);
  } catch (e) {
    err(`Failed to set Worker secret ${name}: ${e.message}`);
  }
}

// ── Step 4: Sanity Webhook ───────────────────────────────────────────────────

log('Creating Sanity webhook...');

const workerUrl = `https://${workerName}.workers.dev`;
const webhook = await sanityApi(
  `/hooks/projects/${sanityProject}`,
  'POST',
  {
    type: 'document',
    name: `Deploy — ${cfPagesName}`,
    url: workerUrl,
    httpMethod: 'POST',
    apiVersion: 'v2021-10-01',
    dataset: sanityDataset,
  }
);

if (webhook.id) {
  ok(`Sanity webhook created (id: ${webhook.id})`);

  // Set trigger rule
  await sanityApi(
    `/hooks/projects/${sanityProject}/${webhook.id}`,
    'PATCH',
    { rule: { on: ['create', 'update'] }, includeDrafts: false }
  );
  ok('Trigger rule set: create + update on published docs');
} else {
  err(`Sanity webhook creation failed: ${JSON.stringify(webhook)}`);
}

// ── Done ─────────────────────────────────────────────────────────────────────

console.log(`
╔══════════════════════════════════════════════════════╗
║  Setup complete for: ${slug.padEnd(31)}║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Sanity Studio:  https://${(sanityProject + '.sanity.studio').padEnd(25)}║
║  Relay Worker:   https://${(workerName + '.workers.dev').padEnd(25)}║
║  GitHub Actions: https://github.com/${githubRepo}/actions
║                                                      ║
║  Next steps:                                         ║
║  1. Create the CF Pages project in the dashboard     ║
║     if it doesn't exist yet.                         ║
║  2. Add client content to Sanity Studio.             ║
║  3. Customise brand colours in src/styles/global.css ║
║  4. Push to main to trigger the first deploy.        ║
╚══════════════════════════════════════════════════════╝
`);
