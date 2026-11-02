// Run manually with a transparent ImageGen logo PNG as the first argument.
const fs = require('node:fs');
const path = require('node:path');

const Jimp = require(require.resolve('jimp-compact', { paths: [require.resolve('@expo/image-utils')] }));

async function main() {
  const input = process.argv[2];
  if (!input)
    throw new Error('Pass the transparent logo PNG path.');
  const root = path.resolve(__dirname, '..');
  const assets = path.join(root, 'assets');
  const source = await Jimp.read(input);
  const { width, height, data } = source.bitmap;
  // Keep the connected artwork and discard isolated alpha export specks.
  const seen = new Uint8Array(width * height);
  let largest = [];
  for (let p = 0; p < seen.length; p++) {
    if (seen[p] || data[p * 4 + 3] < 128)
      continue;
    const group = [p];
    seen[p] = 1;
    for (let i = 0; i < group.length; i++) {
      const q = group[i];
      const x = q % width;
      const y = Math.floor(q / width);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height)
          continue;
        const n = ny * width + nx;
        if (!seen[n] && data[n * 4 + 3] >= 128) {
          seen[n] = 1;
          group.push(n);
        }
      }
    }
    if (group.length > largest.length)
      largest = group;
  }
  if (largest.length < width * height * 0.1)
    throw new Error('Unexpected logo alpha.');
  const mask = new Uint8Array(width * height);
  let left = width;
  let top = height;
  let right = 0;
  let bottom = 0;
  for (const p of largest) {
    mask[p] = 1;
    left = Math.min(left, p % width);
    right = Math.max(right, p % width);
    top = Math.min(top, Math.floor(p / width));
    bottom = Math.max(bottom, Math.floor(p / width));
  }
  source.scan(0, 0, width, height, function (x, y, i) {
    this.bitmap.data[i + 3] = mask[y * width + x] ? 255 : 0;
  });
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  let radius = 0;
  for (const p of largest) {
    const distance = Math.hypot(p % width - cx, Math.floor(p / width) - cy);
    radius = Math.max(radius, distance);
  }
  const artwork = source.crop(left, top, right - left + 1, bottom - top + 1);
  const branding = path.join(assets, 'branding');
  fs.mkdirSync(branding, { recursive: true });
  await artwork.writeAsync(path.join(branding, 'logo-master.png'));
  function foreground(targetRadius) {
    const logo = artwork.clone().resize(
      Math.round(artwork.bitmap.width * targetRadius / radius),
      Math.round(artwork.bitmap.height * targetRadius / radius),
      Jimp.RESIZE_BICUBIC,
    );
    return new Jimp(1024, 1024, 0x00000000).composite(
      logo,
      Math.round((1024 - logo.bitmap.width) / 2),
      Math.round((1024 - logo.bitmap.height) / 2),
    );
  }
  const bg = new Jimp(1024, 1024, 0xFFFFFFFF);
  bg.scan(0, 0, 1024, 1024, function (x, y, i) {
    const t = (x / 1023) ** 1.5 * (1 - y / 1023) ** 1.5;
    const a = [36, 22, 237];
    const b = [145, 78, 255];
    for (let c = 0; c < 3; c++) this.bitmap.data[i + c] = Math.round(a[c] + (b[c] - a[c]) * t);
  });
  const adaptive = foreground(300);
  const themed = adaptive.clone();
  themed.scan(0, 0, 1024, 1024, function (x, y, i) {
    const [r, g, b] = this.bitmap.data.slice(i, i + 3);
    // The lens becomes negative space in the monochrome silhouette.
    if (b > r * 1.2 && b > g * 1.15)
      this.bitmap.data[i + 3] = 0;
    this.bitmap.data[i] = this.bitmap.data[i + 1] = this.bitmap.data[i + 2] = 0;
  });
  const icon = bg.clone().composite(foreground(420), 0, 0);
  await icon.writeAsync(path.join(assets, 'icon.png'));
  await adaptive.writeAsync(path.join(assets, 'adaptive-icon.png'));
  await bg.writeAsync(path.join(assets, 'adaptive-background.png'));
  await themed.writeAsync(path.join(assets, 'adaptive-monochrome.png'));
  await foreground(450).writeAsync(path.join(assets, 'splash-icon.png'));
  await icon.clone().resize(64, 64, Jimp.RESIZE_BICUBIC).writeAsync(path.join(assets, 'favicon.png'));
  let outside = 0;
  adaptive.scan(0, 0, 1024, 1024, function (x, y, i) {
    if (this.bitmap.data[i + 3] > 8 && Math.hypot(x - 511.5, y - 511.5) > 1024 * 66 / 108 / 2)
      outside++;
  });
  if (outside)
    throw new Error(`Logo outside adaptive safe area: ${outside}`);
  const sheet = new Jimp(720, 280, 0xF3F3F3FF);
  const visible = Math.round(1024 * 72 / 108);
  const offset = Math.round((1024 - visible) / 2);
  for (let k = 0; k < 3; k++) {
    const composite = k === 2
      ? new Jimp(1024, 1024, 0xDEDDFAFF).composite(themed, 0, 0)
      : bg.clone().composite(adaptive, 0, 0);
    const tile = composite.crop(offset, offset, visible, visible).resize(192, 192);
    tile.scan(0, 0, 192, 192, function (x, y, i) {
      if (k !== 1 && Math.hypot(x - 95.5, y - 95.5) > 95)
        this.bitmap.data[i + 3] = 0;
    });
    sheet.composite(tile, 24 + k * 240, 16);
    sheet.composite(tile.clone().resize(48, 48), 96 + k * 240, 220);
  }
  await sheet.writeAsync(path.join(branding, 'icon-preview.png'));
  console.log(JSON.stringify({
    size: 1024,
    foregroundCornerAlpha: adaptive.bitmap.data[3],
    outsideSafeArea: outside,
  }));
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
