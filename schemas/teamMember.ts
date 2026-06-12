import { defineType, defineField } from 'sanity';

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({ name: 'displayName', title: 'Name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'displayName' }, validation: r => r.required() }),
    defineField({ name: 'title', title: 'Role / Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'headshot', title: 'Headshot', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'bio', title: 'Bio', type: 'text', rows: 6 }),
    defineField({ name: 'outsideOffice', title: 'Outside the Office', type: 'text', rows: 3 }),
    defineField({ name: 'order', title: 'Display Order', type: 'number' }),
  ],
  preview: { select: { title: 'displayName', subtitle: 'title' } },
});
