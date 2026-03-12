import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const contentRoots = ['archive', 'essay'];

const getGalleryBlock = (html) => {
  const match = html.match(
    /<ul[^>]*\bclass="[^"]*\bgallery\b[^"]*"[^>]*>([\s\S]*?)<\/ul>/i
  );
  return match ? match[1] : '';
};

const checks = [
  {
    id: 'gallery.list',
    test: (html) => /<ul[^>]*\bclass="[^"]*\bgallery\b/.test(html)
  },
  {
    id: 'gallery.item',
    test: (html) => /<li[\s>]/i.test(getGalleryBlock(html))
  },
  {
    id: 'gallery.figure',
    test: (html) => /<figure[\s>]/i.test(getGalleryBlock(html))
  },
  {
    id: 'gallery.media',
    test: (html) => /<(img|picture)\b/i.test(getGalleryBlock(html))
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
      const failed = checks.filter((item) => !item.test(html));
      if (failed.length === 0) {
        console.log(`Gallery check passed: ${path.relative(distDir, target)}`);
        process.exit(0);
      }
    } catch {
      // ignore missing files discovered during traversal
    }
  }

  if (checkedFiles === 0) {
    console.error('Gallery check failed: unable to find built article pages under dist/archive or dist/essay.');
    console.error('Run `npm run build` first.');
    process.exit(1);
  }

  console.error('Gallery check failed: no built article page contained the expected gallery markup.');
  process.exit(1);
} catch (err) {
  console.error('Gallery check failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
