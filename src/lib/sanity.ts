import { createClient } from '@sanity/client';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? 'production';

// When no projectId is configured (template repo without secrets set), use a
// stub that returns empty arrays so the build succeeds with no content rather
// than failing at module import time.
const stub = { fetch: async () => [] as any };

export const sanityClient = projectId
  ? createClient({ projectId, dataset, apiVersion: '2025-06-01', useCdn: true })
  : (stub as any);
