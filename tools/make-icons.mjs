#!/usr/bin/env node
/**
 * make-icons — derive the Margin brand icon set from the master artwork.
 *
 * Source of truth: public/assets/audio/icon.png (a 1254x1254 RGBA PNG: a forest-green
 * "home plate" mark whose letter M is a transparent knockout, so the mark picks up
 * whatever surface it sits on).
 *
 * Two renderings are produced from that one master:
 *
 *   arch  — the mark as drawn: green plate + M knocked out to transparency. Used for
 *           the in-app wordmark and the browser favicons, where it should read as the
 *           brand plate sitting on the tab surface.
 *   tile  — the same plate flattened onto the brand green so the M is filled. Required
 *           wherever a host composites the icon itself (iOS home screen, Android
 *           adaptive/maskable icons): transparency there is filled with black, which
 *           would swallow the knockout.
 *
 * The knockout is filled by flood-filling the transparent region that is *not*
 * reachable from the image border (the letter), which keeps the plate silhouette and
 * its anti-aliased edge untouched.
 *
 * Everything is written next to the HTML that references it:
 *
 *   public/icon.png                 512 arch  (app wordmark + generic <link rel="icon">)
 *   public/icon-192.png             192 arch  (PWA "any")
 *   public/favicon-32.png            32 arch  (browser tab)
 *   public/favicon-16.png            16 arch  (legacy tab)
 *   public/favicon.ico            16/32/48   (legacy browsers and bookmark bars)
 *   public/apple-touch-icon.png      180 tile (iOS home screen)
 *   public/icon-maskable-512.png     512 tile (PWA "maskable", plate inside the 80% safe zone)
 *   public/site.webmanifest                  (PWA name/theme/icon wiring)
 *
 * No image libraries and no external binaries: PNG decoding, resampling, PNG/ICO
 * encoding and the webmanifest are all plain Node + zlib, so the set can be rebuilt
 * anywhere the app builds.
 *
 * Usage:  node tools/make-icons.mjs [--check]
 *         --check  rebuild into memory and fail if any output would change
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync, inflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'public', 'assets', 'audio', 'icon.png');
const OUT_DIR = join(ROOT, 'public');

/** Brand green sampled from the master artwork itself (see dominantColor()). */
const BRAND_GREEN = { r: 10, g: 69, b: 49 };
const KNOCKOUT_FILL = 255; // the letter M is filled with pure white for maximum tab contrast
const MANIFEST_BACKGROUND = '#f5f1e8'; // --paper
const MANIFEST_THEME = '#0a4531'; // brand green, as #rrggbb

/* ------------------------------------------------------------------ PNG decode */

function decodePng(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, 8).equals(signature)) throw new Error('source is not a PNG');

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error('interlaced PNGs are not supported');
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`unsupported color type ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  if (raw.length < (stride + 1) * height) throw new Error('truncated PNG image data');

  const pixels = Buffer.alloc(stride * height);
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    const line = raw.subarray(rowStart + 1, rowStart + 1 + stride);
    const current = Buffer.alloc(stride);
    for (let i = 0; i < stride; i += 1) {
      const left = i >= channels ? current[i - channels] : 0;
      const up = previous[i];
      const upLeft = i >= channels ? previous[i - channels] : 0;
      let value = line[i];
      switch (filter) {
        case 1:
          value += left;
          break;
        case 2:
          value += up;
          break;
        case 3:
          value += (left + up) >> 1;
          break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          value += pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
          break;
        }
        case 0:
          break;
        default:
          throw new Error(`unsupported row filter ${filter}`);
      }
      current[i] = value & 0xff;
    }
    current.copy(pixels, y * stride);
    previous = current;
  }

  return { width, height, channels, pixels };
}

/** Normalise any decoded PNG to tightly packed RGBA. */
function toRgba(image) {
  const { width, height, channels, pixels } = image;
  const data = new Uint8Array(width * height * 4);
  for (let i = 0, o = 0; i < width * height; i += 1, o += 4) {
    const s = i * channels;
    data[o] = pixels[s];
    data[o + 1] = channels >= 3 ? pixels[s + 1] : pixels[s];
    data[o + 2] = channels >= 3 ? pixels[s + 2] : pixels[s];
    data[o + 3] = channels === 4 ? pixels[s + 3] : channels === 2 ? pixels[s + 1] : 255;
  }
  return { width, height, data };
}

/* ------------------------------------------------------------------- PNG encode */

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([length, body, crc]);
}

/**
 * Encode 8-bit RGBA, non-interlaced, filter type 0 (None) on every scanline.
 *
 * Adaptive filtering was measured against this artwork and loses: the master carries
 * ~1/255 of per-pixel encoder noise, which no predictor can model, so the filter byte
 * and the prediction residue only add entropy. Snapping the noise away (see
 * snapToBrandColour) is what actually shrinks the file.
 */
function encodePng(image) {
  const { width, height, data } = image;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour + alpha
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(data.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Encode a Windows .ico holding one PNG-compressed entry per size. PNG-in-ICO is
 * supported by every browser that reads <link rel="icon">, and keeps the alpha
 * channel lossless (a BMP entry would need a premultiplied AND mask).
 */
function encodeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  const blobs = [];
  let offset = header.length + images.length * 16;
  for (const image of images) {
    const blob = encodePng(image);
    const entry = Buffer.alloc(16);
    entry[0] = image.width >= 256 ? 0 : image.width;
    entry[1] = image.height >= 256 ? 0 : image.height;
    entry[2] = 0; // palette colours
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(blob.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    blobs.push(blob);
    offset += blob.length;
  }
  return Buffer.concat([header, ...entries, ...blobs]);
}

/* ------------------------------------------------------------------- resampling */

/**
 * Area-average downscale with alpha premultiplied before averaging and restored
 * after, so semi-transparent edges keep their hue instead of bleeding the RGB that
 * sits behind them.
 */
function resize(image, targetWidth, targetHeight) {
  const { width, height, data } = image;
  if (targetWidth === width && targetHeight === height) return image;
  const out = new Uint8Array(targetWidth * targetHeight * 4);
  for (let dy = 0; dy < targetHeight; dy += 1) {
    const y0 = Math.floor((dy * height) / targetHeight);
    const y1 = Math.max(y0 + 1, Math.ceil(((dy + 1) * height) / targetHeight));
    for (let dx = 0; dx < targetWidth; dx += 1) {
      const x0 = Math.floor((dx * width) / targetWidth);
      const x1 = Math.max(x0 + 1, Math.ceil(((dx + 1) * width) / targetWidth));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const i = (y * width + x) * 4;
          const alpha = data[i + 3];
          r += data[i] * alpha;
          g += data[i + 1] * alpha;
          b += data[i + 2] * alpha;
          a += alpha;
          n += 1;
        }
      }
      const o = (dy * targetWidth + dx) * 4;
      if (a === 0) continue; // leave fully transparent pixels at 0,0,0,0
      out[o] = Math.round(r / a);
      out[o + 1] = Math.round(g / a);
      out[o + 2] = Math.round(b / a);
      out[o + 3] = Math.round(a / n);
    }
  }
  return { width: targetWidth, height: targetHeight, data: out };
}

/** Flatten an image onto an opaque colour. */
function flatten(image, colour) {
  const { width, height, data } = image;
  const out = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    const alpha = data[o + 3] / 255;
    out[o] = Math.round(data[o] * alpha + colour.r * (1 - alpha));
    out[o + 1] = Math.round(data[o + 1] * alpha + colour.g * (1 - alpha));
    out[o + 2] = Math.round(data[o + 2] * alpha + colour.b * (1 - alpha));
    out[o + 3] = 255;
  }
  return { width, height, data: out };
}

/** Paste an image centred on an opaque canvas. */
function placeOn(image, size, colour) {
  const canvas = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    canvas[i * 4] = colour.r;
    canvas[i * 4 + 1] = colour.g;
    canvas[i * 4 + 2] = colour.b;
    canvas[i * 4 + 3] = 255;
  }
  const left = Math.floor((size - image.width) / 2);
  const top = Math.floor((size - image.height) / 2);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const s = (y * image.width + x) * 4;
      const d = ((y + top) * size + (x + left)) * 4;
      const alpha = image.data[s + 3] / 255;
      canvas[d] = Math.round(image.data[s] * alpha + canvas[d] * (1 - alpha));
      canvas[d + 1] = Math.round(image.data[s + 1] * alpha + canvas[d + 1] * (1 - alpha));
      canvas[d + 2] = Math.round(image.data[s + 2] * alpha + canvas[d + 2] * (1 - alpha));
      canvas[d + 3] = 255;
    }
  }
  return { width: size, height: size, data: canvas };
}

/* ------------------------------------------------------------------------ masks */

/**
 * Flood fill the transparent region reachable from the border; whatever transparent
 * pixels remain are enclosed by the plate — i.e. the letter knockout.
 */
function exteriorMask(image) {
  const { width, height, data } = image;
  const outside = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const push = (index) => {
    if (outside[index] || data[index * 4 + 3] !== 0) return;
    outside[index] = 1;
    queue[tail] = index;
    tail += 1;
  };
  for (let x = 0; x < width; x += 1) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    push(y * width);
    push(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) push(index - 1);
    if (x < width - 1) push(index + 1);
    if (y > 0) push(index - width);
    if (y < height - 1) push(index + width);
  }
  return outside;
}

/** Opaque bounding box of an RGBA image (used to size the in-app wordmark). */
function opaqueBounds(image) {
  const { width, height, data } = image;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** Most common fully opaque colour, averaged within its quantisation bucket. */
function dominantColour(image) {
  const { width, height, data } = image;
  const buckets = new Map();
  for (let i = 0; i < width * height; i += 1) {
    if (data[i * 4 + 3] !== 255) continue;
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.n += 1;
    buckets.set(key, bucket);
  }
  let best = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.n > best.n) best = bucket;
  }
  return { r: Math.round(best.r / best.n), g: Math.round(best.g / best.n), b: Math.round(best.b / best.n) };
}

/**
 * Remove the ~1/255 encoder noise the master carries inside the plate.
 *
 * The plate is a flat brand green, but every opaque pixel sits on a slightly
 * different value (measured spread: +/-2 per channel, no gradient, no texture). That
 * noise is invisible at any size an icon is shown, yet it defeats PNG filtering and
 * costs roughly 20x in file size. Fully opaque pixels within `tolerance` of the brand
 * colour are snapped to it exactly; partially transparent edge pixels keep their
 * original colour so the anti-aliased outline is untouched.
 *
 * Returns the largest per-channel delta that was applied, so callers can prove the
 * edit is imperceptible.
 */
function snapToBrandColour(image, colour, tolerance = 4) {
  const { width, height, data } = image;
  let maxDelta = 0;
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    if (data[o + 3] !== 255) continue;
    const d = Math.max(
      Math.abs(data[o] - colour.r),
      Math.abs(data[o + 1] - colour.g),
      Math.abs(data[o + 2] - colour.b),
    );
    if (d > tolerance) continue;
    if (d > maxDelta) maxDelta = d;
    data[o] = colour.r;
    data[o + 1] = colour.g;
    data[o + 2] = colour.b;
  }
  return maxDelta;
}

/* ------------------------------------------------------------------------- main */

const checkOnly = process.argv.includes('--check');

if (!existsSync(SOURCE)) {
  console.error(`make-icons: master artwork not found at ${SOURCE}`);
  process.exit(1);
}

const master = toRgba(decodePng(readFileSync(SOURCE)));
const brand = dominantColour(master);
const green = `#${[brand.r, brand.g, brand.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

// Fill the knockout so the letter reads on any surface, and report the plate bounds
// so the wordmark in index.html can be sized to match the previous CSS mark.
const outside = exteriorMask(master);
const plate = new Uint8Array(master.width * master.height * 4);
for (let i = 0; i < master.width * master.height; i += 1) {
  const alpha = master.data[i * 4 + 3];
  if (alpha > 0) {
    plate.set(master.data.subarray(i * 4, i * 4 + 4), i * 4);
  } else if (!outside[i]) {
    plate[i * 4] = KNOCKOUT_FILL;
    plate[i * 4 + 1] = KNOCKOUT_FILL;
    plate[i * 4 + 2] = KNOCKOUT_FILL;
    plate[i * 4 + 3] = 255;
  }
}
const plateImage = { width: master.width, height: master.height, data: plate };
const snapped = snapToBrandColour(plateImage, brand);
const bounds = opaqueBounds(plateImage);

const arch = (size) => resize(plateImage, size, size);
const tile = (size) => flatten(resize(plateImage, size, size), brand);
// Android crops adaptive icons to a circle of ~80% of the canvas, so keep the whole
// plate inside that safe zone.
const maskable = (size) => placeOn(resize(plateImage, Math.round(size * 0.8), Math.round(size * 0.8)), size, brand);

const outputs = [
  { file: 'icon.png', blob: encodePng(arch(512)), note: '512 arch — app wordmark' },
  { file: 'icon-192.png', blob: encodePng(arch(192)), note: '192 arch — PWA any' },
  { file: 'favicon-32.png', blob: encodePng(arch(32)), note: '32 arch — browser tab' },
  { file: 'favicon-16.png', blob: encodePng(arch(16)), note: '16 arch — legacy tab' },
  { file: 'favicon.ico', blob: encodeIco([arch(16), arch(32), arch(48)]), note: '16/32/48 — legacy + bookmarks' },
  { file: 'apple-touch-icon.png', blob: encodePng(tile(180)), note: '180 tile — iOS home screen' },
  { file: 'icon-maskable-512.png', blob: encodePng(maskable(512)), note: '512 tile — PWA maskable' },
  {
    file: 'site.webmanifest',
    blob: Buffer.from(
      `${JSON.stringify(
        {
          name: 'Margin',
          short_name: 'Margin',
          description: 'Turn your own documents into private, focused typing practice.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: MANIFEST_BACKGROUND,
          theme_color: MANIFEST_THEME,
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        null,
        2,
      )}\n`,
      'utf8',
    ),
    note: 'PWA manifest',
  },
];

console.log(`make-icons: master ${master.width}x${master.height}, brand green ${green}`);
console.log(
  `make-icons: plate bounds ${bounds.width}x${bounds.height} inside ${master.width}x${master.height} ` +
    `(${((bounds.width / master.width) * 100).toFixed(1)}% x ${((bounds.height / master.height) * 100).toFixed(1)}%)`,
);
console.log(`make-icons: snapped plate noise to the brand green, max per-channel delta ${snapped}/255`);

let changed = 0;
for (const output of outputs) {
  const path = join(OUT_DIR, output.file);
  const previous = existsSync(path) ? readFileSync(path) : null;
  const stale = !previous || !previous.equals(output.blob);
  if (stale) changed += 1;
  if (checkOnly) {
    console.log(`  ${stale ? 'STALE' : 'ok   '}  ${output.file} (${output.blob.length} bytes) — ${output.note}`);
  } else {
    if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(path, output.blob);
    console.log(`  wrote  ${output.file} (${output.blob.length} bytes) — ${output.note}`);
  }
}

if (checkOnly && changed > 0) {
  console.error(`make-icons: ${changed} of ${outputs.length} icon file(s) are out of date — run \`node tools/make-icons.mjs\``);
  process.exit(1);
}
console.log(`make-icons: ${outputs.length} file(s) ${checkOnly ? 'verified' : 'generated'} in public/`);
