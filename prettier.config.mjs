/** @type {import('prettier').Config} */
const config = {
  singleQuote: true,
  tabWidth: 2,
  semi: true,
  trailingComma: 'all',
  printWidth: 120,
  plugins: ['prettier-plugin-tailwindcss'],
  // Tailwind v4: class order comes from the CSS entry point.
  tailwindStylesheet: './src/app/globals.css',
  tailwindFunctions: ['clsx', 'cn'],
};

export default config;
