// Public site identity shared by metadata, the manifest, robots and the sitemap.
export const siteConfig = {
  name: 'Movie Plot by Email',
  shortName: 'Movie Plot',
  description: 'Tell us what you just watched and get the plot summary by email.',
  // Absolute base for canonical, Open Graph and sitemap URLs. Set SITE_URL when deployed.
  url: process.env.SITE_URL || 'http://localhost:3000',
  // Matches the --primary / --background tokens in globals.css (indigo-600, zinc-50, zinc-950).
  colors: { primary: '#4f46e5', light: '#fafafa', dark: '#09090b' },
};
