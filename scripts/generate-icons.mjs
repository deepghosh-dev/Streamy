import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, "public");
const inputPath = path.join(publicDir, "logo.png");
const manifestPath = path.join(publicDir, "manifest.json");

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function parseSize(size) {
  const match = /^\s*(\d+)\s*x\s*(\d+)\s*$/.exec(size);
  if (!match) throw new Error(`Invalid size: ${size}`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generatePng({ base, outRelative, width, height }) {
  const outPath = path.join(publicDir, outRelative);
  await ensureDir(path.dirname(outPath));

  await base
    .clone()
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function main() {
  if (!(await fileExists(inputPath))) {
    throw new Error(
      `Missing input logo at ${inputPath}. Put your logo at public/logo.png`
    );
  }

  const base = sharp(inputPath).ensureAlpha();

  // 1) Generate all icons referenced by manifest.json (android/ios/windows11, etc.)
  const manifestRaw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);

  const manifestIcons = Array.isArray(manifest.icons) ? manifest.icons : [];

  for (const icon of manifestIcons) {
    if (!icon?.src || !icon?.sizes) continue;

    // Some manifests may have multiple sizes like "48x48 72x72"; we use the first.
    const firstSize = String(icon.sizes).trim().split(/\s+/)[0];
    const { width, height } = parseSize(firstSize);

    await generatePng({
      base,
      outRelative: icon.src,
      width,
      height,
    });
  }

  // 2) Generate browser favicon + apple touch icon (used by Next metadata)
  const extras = [
    { out: "favicon-16x16.png", size: "16x16" },
    { out: "favicon-32x32.png", size: "32x32" },
    { out: "apple-touch-icon.png", size: "180x180" },
  ];

  for (const extra of extras) {
    const { width, height } = parseSize(extra.size);
    await generatePng({
      base,
      outRelative: extra.out,
      width,
      height,
    });
  }

  console.log(
    `Generated ${manifestIcons.length + extras.length} icons from public/logo.png`
  );
}

await main();
