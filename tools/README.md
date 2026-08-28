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
