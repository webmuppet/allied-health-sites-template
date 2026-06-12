import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

const projectId = process.env.SANITY_PROJECT_ID ?? 'YOUR_PROJECT_ID';
const dataset = process.env.SANITY_DATASET ?? 'production';

export default defineConfig({
  name: 'allied-health-site',
  title: 'Site Content',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [
      {
        name: 'teamMember',
        title: 'Team Member',
        type: 'document',
        fields: [
          { name: 'displayName', title: 'Name', type: 'string', validation: (r: any) => r.required() },
          { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'displayName' }, validation: (r: any) => r.required() },
          { name: 'title', title: 'Role / Title', type: 'string', validation: (r: any) => r.required() },
          { name: 'headshot', title: 'Headshot (image path)', type: 'string' },
          { name: 'bio', title: 'Bio', type: 'text', rows: 6 },
          { name: 'outsideOffice', title: 'Outside the Office', type: 'text', rows: 3 },
          { name: 'order', title: 'Display Order', type: 'number' },
        ],
        preview: { select: { title: 'displayName', subtitle: 'title' } },
      },
      {
        name: 'post',
        title: 'Blog Post',
        type: 'document',
        fields: [
          { name: 'title', title: 'Title', type: 'string', validation: (r: any) => r.required() },
          { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (r: any) => r.required() },
          { name: 'date', title: 'Date', type: 'date', validation: (r: any) => r.required() },
          { name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 },
          { name: 'body', title: 'Body (Markdown)', type: 'text', rows: 20 },
        ],
        preview: { select: { title: 'title', subtitle: 'date' } },
        orderings: [{ title: 'Date, Newest', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
      },
      {
        name: 'siteSettings',
        title: 'Site Settings',
        type: 'document',
        fields: [
          { name: 'practiceName', title: 'Practice Name', type: 'string' },
          { name: 'phone', title: 'Phone', type: 'string' },
          { name: 'phoneHref', title: 'Phone href (e.g. tel:0900000000)', type: 'string' },
          { name: 'email', title: 'Email', type: 'string' },
          { name: 'address', title: 'Street Address', type: 'string' },
          { name: 'suburb', title: 'Suburb', type: 'string' },
          { name: 'postcode', title: 'Postcode', type: 'string' },
          { name: 'facebook', title: 'Facebook URL', type: 'url' },
          { name: 'googleMaps', title: 'Google Maps URL', type: 'url' },
          { name: 'bookingUrl', title: 'Online Booking URL', type: 'string' },
          { name: 'tagline', title: 'Tagline', type: 'string' },
        ],
        preview: { select: { title: 'practiceName' } },
      },
    ],
  },
});
