import imageUrlBuilder from '@sanity/image-url';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? 'production';

// Only build when a project is configured; otherwise return a safe no-op.
const builder = projectId ? imageUrlBuilder({ projectId, dataset }) : null;

export function urlFor(source: any) {
  if (!builder || !source) return { url: () => '' };
  return builder.image(source);
}
