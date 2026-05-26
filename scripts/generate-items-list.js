// Automatically generates src/items-list.js from public/items/*.png filenames.
// Runs automatically before `npm start` and `npm build` via prestart/prebuild hooks.

const fs = require('fs');
const path = require('path');

const itemsDir = path.join(__dirname, '../public/items');
const outputFile = path.join(__dirname, '../src/items-list.js');

const filenames = fs
  .readdirSync(itemsDir)
  .filter(f => f.endsWith('.png'))
  .map(f => f.slice(0, -4)) // strip .png
  .sort();

const lines = filenames.map(f => `  '${f}',`).join('\n');

const content = `// AUTO-GENERATED — do not edit by hand.
// To update: add/remove PNGs from /public/items/ and restart npm.
const PUBLIC_URL = process.env.PUBLIC_URL || '';

const toName = s =>
  s.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());

const filenames = [
${lines}
];

export const allItemsList = filenames.map((f, i) => ({
  id: i,
  name: toName(f),
  filename: f,
  icon: \`\${PUBLIC_URL}/items/\${f}.png\`,
}));

export const findItems = (query) => {
  if (!query) return allItemsList;
  const lq = query.toLowerCase().trim();
  const lqUnderscore = lq.replace(/ /g, '_');
  const lqSpace = lq.replace(/_/g, ' ');
  return allItemsList.filter(item => {
    const n = item.name.toLowerCase();
    const f = n.replace(/ /g, '_');
    return f.includes(lqUnderscore) || n.includes(lqSpace);
  });
};
`;

fs.writeFileSync(outputFile, content, 'utf8');
console.log(`[generate-items-list] Generated ${filenames.length} items from /public/items/`);
