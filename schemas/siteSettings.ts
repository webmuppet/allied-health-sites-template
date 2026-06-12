import { defineType, defineField } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'practiceName', title: 'Practice Name', type: 'string' }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'phoneHref', title: 'Phone href (e.g. tel:0900000000)', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'address', title: 'Street Address', type: 'string' }),
    defineField({ name: 'suburb', title: 'Suburb', type: 'string' }),
    defineField({ name: 'postcode', title: 'Postcode', type: 'string' }),
    defineField({ name: 'bookingUrl', title: 'Online Booking URL', type: 'string' }),
    defineField({ name: 'facebook', title: 'Facebook URL', type: 'url' }),
    defineField({ name: 'googleMaps', title: 'Google Maps embed URL', type: 'url' }),
  ],
  preview: { select: { title: 'practiceName' } },
});
