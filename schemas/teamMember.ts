import { defineType, defineField } from 'sanity';

const richText = {
  type: 'array',
  of: [
    {
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
      },
    },
  ],
} as const;

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({ name: 'displayName', title: 'Name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'displayName' }, validation: r => r.required() }),
    defineField({ name: 'title', title: 'Role / Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'headshot', title: 'Headshot', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'bio', title: 'Bio', ...richText }),
    defineField({ name: 'outsideOffice', title: 'Outside the Office', ...richText }),
    defineField({ name: 'order', title: 'Display Order', type: 'number' }),
  ],
  preview: { select: { title: 'displayName', subtitle: 'title' } },
});
