import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { teamMember, post, siteSettings } from './schemas';

const projectId = process.env.SANITY_PROJECT_ID ?? 'YOUR_PROJECT_ID';
const dataset = process.env.SANITY_DATASET ?? 'production';

export default defineConfig({
  name: 'allied-health-site',
  title: 'Site Content',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [teamMember, post, siteSettings],
  },
});
