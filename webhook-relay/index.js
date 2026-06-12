// Relay: receives Sanity webhook → triggers GitHub Actions workflow_dispatch
// Deploy: bunx wrangler deploy index.js --name {client}-sanity-relay
// Secret: bunx wrangler secret put GH_TOKEN --name {client}-sanity-relay
// Secret: bunx wrangler secret put GH_REPO --name {client}-sanity-relay  (e.g. "webmuppet/client-site")

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const response = await fetch(
      `https://api.github.com/repos/${env.GH_REPO}/actions/workflows/deploy.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GH_TOKEN}`,
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
      response.status === 204 ? 'Build triggered' : `GitHub error: ${text}`,
      { status: response.status === 204 ? 200 : 500 }
    );
  },
};
