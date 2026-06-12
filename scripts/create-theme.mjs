#!/usr/bin/env node
/**
 * Create a new theme for the allied-health-sites-template.
 *
 * Usage — scaffold from default:
 *   node scripts/create-theme.mjs --name mytheme
 *
 * Usage — pull from a GitHub repo:
 *   node scripts/create-theme.mjs --name astrowind --from https://github.com/arthelokyo/astrowind
 *
 * When --from is provided, the script clones the repo and copies its
 * src/layouts/, src/components/, and src/styles/ into src/themes/{name}/.
 * You'll then need to:
 *   1. Update @lib/sanity imports in any component that fetches from Sanity.
 *   2. Ensure Layout.astro accepts { title, description?, ogImage? } props.
 *   3. Set the theme as active (see instructions printed at end).
 */

import { parseArgs } from 'util';
import { execSync } from 'child_process';
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';

const { values } = parseArgs({
  options: {
    name: { type: 'string' },
    from: { type: 'string' },
  },
});

if (!values.name) {
  console.error('\n❌  --name is required\n');
  console.error('  node scripts/create-theme.mjs --name mytheme');
  console.error('  node scripts/create-theme.mjs --name astrowind --from https://github.com/arthelokyo/astrowind\n');
  process.exit(1);
}

const themeName = values.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
const themeDir = new URL(`../src/themes/${themeName}`, import.meta.url).pathname;
const log = (msg) => console.log(`\n→ ${msg}`);
const ok  = (msg) => console.log(`  ✓ ${msg}`);

if (existsSync(themeDir)) {
  console.error(`\n❌  Theme "${themeName}" already exists at src/themes/${themeName}/\n`);
  process.exit(1);
}

if (values.from) {
  // ── Pull from GitHub ────────────────────────────────────────────────────────
  const tmpDir = `/tmp/theme-pull-${themeName}-${Date.now()}`;

  log(`Cloning ${values.from}...`);
  try {
    execSync(`git clone --depth 1 ${values.from} ${tmpDir}`, { stdio: 'pipe' });
    ok('Cloned');
  } catch (e) {
    console.error(`\n❌  git clone failed: ${e.stderr?.toString() ?? e.message}\n`);
    process.exit(1);
  }

  mkdirSync(themeDir, { recursive: true });

  const srcBase = join(tmpDir, 'src');
  let copied = [];

  for (const folder of ['layouts', 'components', 'styles', 'assets']) {
    const src = join(srcBase, folder);
    if (existsSync(src)) {
      cpSync(src, join(themeDir, folder), { recursive: true });
      ok(`Copied src/${folder}/`);
      copied.push(folder);
    }
  }

  rmSync(tmpDir, { recursive: true, force: true });
  ok('Cleaned up temp clone');

  console.log(`
╔══════════════════════════════════════════════════════╗
║  Theme "${themeName}" created from ${values.from.split('/').slice(-1)[0].padEnd(20)}  ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Copied: ${copied.join(', ').padEnd(43)}║
║                                                      ║
║  Next steps:                                         ║
║                                                      ║
║  1. Review the theme files in:                       ║
║     src/themes/${themeName}/                         ║
║                                                      ║
║  2. Ensure Layout.astro accepts these props:         ║
║     { title: string, description?: string,           ║
║       ogImage?: string }                             ║
║                                                      ║
║  3. Add @lib/sanity imports to any component         ║
║     that needs Sanity data.                          ║
║                                                      ║
║  4. Activate the theme in astro.config.mjs:          ║
║     const ACTIVE_THEME = new URL(                    ║
║       './src/themes/${themeName}',                   ║
║       import.meta.url                                ║
║     ).pathname;                                      ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
`);

} else {
  // ── Scaffold from default ───────────────────────────────────────────────────
  const defaultDir = new URL('../src/themes/default', import.meta.url).pathname;

  log(`Scaffolding "${themeName}" from default theme...`);
  cpSync(defaultDir, themeDir, { recursive: true });
  ok(`Created src/themes/${themeName}/`);

  console.log(`
╔══════════════════════════════════════════════════════╗
║  Theme "${themeName}" scaffolded from default        ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Edit files in src/themes/${themeName}/              ║
║                                                      ║
║  Activate in astro.config.mjs:                       ║
║    const ACTIVE_THEME = new URL(                     ║
║      './src/themes/${themeName}',                    ║
║      import.meta.url                                 ║
║    ).pathname;                                       ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
`);
}
