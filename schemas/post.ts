import { defineType, defineField } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({ name: 'date', title: 'Date', type: 'date', validation: r => r.required() }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({ name: 'body', title: 'Body (Markdown)', type: 'text', rows: 20 }),
  ],
  preview: { select: { title: 'title', subtitle: 'date' } },
  orderings: [{ title: 'Date, Newest', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
});
