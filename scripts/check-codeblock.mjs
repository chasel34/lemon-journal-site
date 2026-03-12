import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const contentRoots = ['archive', 'essay'];

const hasClass = (html, className) => {
  const pattern = new RegExp(`class="[^"]*\\b${className}\\b`, 'i');
  return pattern.test(html);
};

const getTagsByClass = (html, tag, className) => {
  const pattern = new RegExp(`<${tag}[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*"[^>]*>`, 'gi');
  return Array.from(html.matchAll(pattern)).map((match) => match[0]);
};

const checks = [
  {
    id: 'code-block.wrapper',
    test: (html) => hasClass(html, 'code-block')
  },
  {
    id: 'code-block.toolbar',
    test: (html) => hasClass(html, 'code-toolbar')
  },
  {
    id: 'code-block.data-attrs',
    test: (html) => {
      const blocks = getTagsByClass(html, 'div', 'code-block');
      return blocks.some((tag) => /data-lines\s*=/.test(tag) && /data-lang\s*=/.test(tag));
    }
  },
  {
    id: 'code-copy.button',
    test: (html) => {
      const buttons = getTagsByClass(html, 'button', 'code-copy');
      return buttons.some((tag) => /aria-label\s*=/.test(tag) && /data-state\s*=/.test(tag));
    }
  },
  {
    id: 'code-lines.class',
    test: (html) => hasClass(html, 'line')
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
        console.log(`Code block check passed: ${path.relative(distDir, target)}`);
        process.exit(0);
      }
    } catch {
      // ignore missing files discovered during traversal
    }
  }

  if (checkedFiles === 0) {
    console.error('Code block check failed: unable to find built article pages under dist/archive or dist/essay.');
    console.error('Run `npm run build` first.');
    process.exit(1);
  }

  console.error('Code block check failed: no built article page contained the expected code block markup.');
  process.exit(1);
} catch (err) {
  console.error('Code block check failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
