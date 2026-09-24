# Verification harnesses

Playwright + headless-Chromium probes used across the design passes. They measure the
**rendered** app against a dev server, so start one first:

```bash
npx vite --port 5173      # then, from this directory:
node verify.mjs ./shots   # 15-part premium-UI check: focus targets, selection bar, dormant
                          # button, overlay, char states, results recession, tab order,
                          # 360/320, reduced motion, console errors
node a11y.mjs  ./shots    # axe-core, composed contrast, newline marker state, focus rings
node audit.mjs ./shots    # element census: x/y/w/h, margin, radius, border, shadow, type
node min.mjs   ./shots    # restraint census: rendered shadows, bordered nodes, pseudo
                          # decoration, accent-hue budget + focus-during-typing states
node ab.mjs    after      # single-state restraint snapshot -> ab-<label>.json
python3 min_ab.py         # A/B the minimalist pass against its own pre-state (inverts this
                          # pass's edits, asserts every anchor matches exactly once, restores
                          # in a `finally`). Do NOT A/B against git HEAD: HEAD may predate
                          # earlier passes and yields a false baseline.
```

Requirements: `npm i -D playwright` in the project root (or a global install), Chromium
available. Output PNGs land in the directory passed as argv.

## Static checks (no dev server needed)

```bash
node sri-check.mjs index.html dist/index.html   # or: npm run check:sri
node make-icons.mjs                            # or: npm run icons
```

Subresource Integrity gate (frontendchecklist.io/rules/html/subresource-integrity).
Scans the given HTML files (missing files are skipped, so it works before and after
`npm run build`) and fails when any cross-origin `<script src>`,
`<link rel="stylesheet">`, `<link rel="preload" as="script|style">`, or
`<link rel="modulepreload">` lacks a well-formed `integrity` attribute or a
`crossorigin` attribute, or points at an endpoint known to serve
User-Agent-dependent CSS that no hash can pin (fonts.googleapis.com/css*).
Pass `--verify` to additionally fetch each cross-origin URL, send the page
origin, recompute the hash, and fail if the response does not allow CORS for the
page (credentialed loads also require `Access-Control-Allow-Credentials: true`).
Same-origin resources are listed for visibility but need no SRI. The same rule is
enforced on every `npm test` run by `tests/sri.test.js`, which parses the HTML
with jsdom instead of a regex and guards the dynamic axe-core loader. That
optional audit uses a version-pinned jsDelivr URL and native script-element SRI.

## Brand icon generation

`make-icons.mjs` derives the whole favicon / app-icon set in `public/` from the master
artwork at `public/assets/audio/icon.png` (the icon sits in the audio folder only
because that is where it was committed; nothing about it is audio). Run it after the
master changes, or with `--check` to fail when the committed set has drifted.

The master is a square RGBA PNG whose letter M is a transparent knockout, so the mark
takes the colour of whatever surface it sits on. Two renderings come out of that:

- **arch** — the mark as drawn (green plate, knockout left transparent). Used for the
  in-app wordmark and the browser favicons, where the plate should read as sitting on
  the tab surface.
- **tile** — the plate flattened onto the brand green so the knockout is filled.
  Required wherever the *host* composites the icon, because those hosts fill
  transparency with black and would swallow the letter: `apple-touch-icon.png` (iOS)
  and the `maskable` manifest entry (Android crops to the central 80% circle, so the
  plate is also scaled into that safe zone).

The knockout is filled by flood-filling the transparent region that is not reachable
from the image border, which leaves the plate silhouette and its anti-aliased edge
untouched. Fully opaque plate pixels within 4/255 of the sampled brand green
(`#0a4531`) are snapped to it exactly: the master carries ~1/255 of encoder noise that
no PNG filter can model and that costs roughly 20x in file size. The tool prints the
largest delta it applied so the edit stays auditable.

Outputs, all of which `index.html` references: `icon.png` (512 arch),
`icon-192.png` (192 arch), `favicon-16.png`, `favicon-32.png`, `favicon.ico`
(16/32/48), `apple-touch-icon.png` (180 tile), `icon-maskable-512.png` (512 tile)
and `site.webmanifest`. PNG decoding, resampling, PNG/ICO encoding and the manifest
are plain Node + `zlib` — no image libraries and no external binaries.
