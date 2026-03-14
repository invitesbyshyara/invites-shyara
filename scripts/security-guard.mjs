import fs from "fs/promises";
import path from "path";

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error("Usage: node scripts/security-guard.mjs <dir> [dir...]");
  process.exit(1);
}

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ALLOWED_DANGEROUSLY_SET_HTML = [
  path.normalize("src/components/ui/chart.tsx"),
  path.normalize("frontend/src/components/ui/chart.tsx"),
  path.normalize("../frontend/src/components/ui/chart.tsx"),
];

const patterns = [
  { label: "eval", regex: /\beval\s*\(/g },
  { label: "new Function", regex: /\bnew\s+Function\s*\(/g },
  { label: "$queryRawUnsafe", regex: /\$queryRawUnsafe\b/g },
  { label: "$executeRawUnsafe", regex: /\$executeRawUnsafe\b/g },
];

const violations = [];

const walk = async (target) => {
  const stats = await fs.stat(target);
  if (stats.isDirectory()) {
    const entries = await fs.readdir(target, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "build" || entry.name.startsWith(".")) {
        continue;
      }
      await walk(path.join(target, entry.name));
    }
    return;
  }

  if (!EXTENSIONS.has(path.extname(target))) {
    return;
  }

  const relativePath = path.normalize(path.relative(process.cwd(), target));
  const source = await fs.readFile(target, "utf8");

  for (const pattern of patterns) {
    if (pattern.regex.test(source)) {
      violations.push(`${relativePath}: banned ${pattern.label}`);
    }
  }

  if (
    source.includes("dangerouslySetInnerHTML") &&
    !ALLOWED_DANGEROUSLY_SET_HTML.some((allowedPath) => relativePath.endsWith(allowedPath))
  ) {
    violations.push(`${relativePath}: banned dangerouslySetInnerHTML`);
  }
};

for (const root of roots) {
  await walk(path.resolve(root));
}

if (violations.length > 0) {
  console.error("Security guard violations found:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Security guard passed.");
