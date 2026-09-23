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
