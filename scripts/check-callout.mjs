import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const contentRoots = ['archive', 'essay'];

const checks = [
  {
    id: 'callout.tip',
    pattern: /class="[^"]*\bcallout\b[^"]*\btip\b/
  },
  {
    id: 'callout-title',
    pattern: /class="[^"]*\bcallout-title\b/
  }
];

async function getHtmlTargets() {
  const targets = [];

  for (const root of contentRoots) {
    const rootDir = path.join(distDir, root);
    let entries = [];
    try {
      entries = await readdir(rootDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'page') continue;
      targets.push(path.join(rootDir, entry.name, 'index.html'));
    }
  }

  return targets;
}

try {
  const targets = await getHtmlTargets();
  let checkedFiles = 0;

  for (const target of targets) {
    try {
      const html = await readFile(target, 'utf8');
      checkedFiles += 1;
      const failed = checks.filter((item) => !item.pattern.test(html));
      if (failed.length === 0) {
        console.log(`Callout check passed: ${path.relative(distDir, target)}`);
        process.exit(0);
      }
    } catch {
      // ignore missing files discovered during traversal
    }
  }

  if (checkedFiles === 0) {
    console.error('Callout check failed: unable to find built article pages under dist/archive or dist/essay.');
    console.error('Run `npm run build` first.');
    process.exit(1);
  }

  console.error('Callout check failed: no built article page contained the expected callout markup.');
  process.exit(1);
} catch (err) {
  console.error('Callout check failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
