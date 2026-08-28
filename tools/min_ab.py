"""A/B the minimalist pass against its own pre-state.

Reconstructs the pre-minimalist files by inverting this pass's edits, measures
both states with tools/ab.mjs, and always restores the current (AFTER) files.
"""
import json
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path('/home/user/Margin')
CSS = ROOT / 'src/styles.css'
HTML = ROOT / 'index.html'
AFTER = (pathlib.Path('/tmp/KEEP-A.css').read_text(), pathlib.Path('/tmp/KEEP-A.html').read_text())

# (after_snippet, before_snippet) -- applied to the current file to walk it back
CSS_INV = [
    ("    color: rgba(31,41,37,.022);",
     "    color: rgba(34,75,60,.028);"),
    ("    letter-spacing: -.065em;\n    color: var(--ink);",
     "    letter-spacing: -.065em;\n    color: var(--forest);"),
    ("    border: 2px dashed var(--sage);\n    background: var(--white);",
     "    border: 2px dashed var(--sage);\n    background: var(--surface-raised);\n    box-shadow: var(--shadow);"),
    ("    border: 1px solid var(--line);\n    background: var(--white);\n  }\n  .parse-status:not([hidden]) { display: flex; }",
     "    border: 1px solid var(--line);\n    background: var(--white);\n    box-shadow: var(--shadow);\n  }\n  .parse-status:not([hidden]) { display: flex; }"),
    ("    background: var(--white);\n    border: 1px solid var(--surface-border);\n    font: 400 1.04rem/1.82 var(--serif);",
     "    background: var(--white);\n    border: 1px solid var(--surface-border);\n    box-shadow: var(--shadow-soft);\n    font: 400 1.04rem/1.82 var(--serif);"),
    ("    background: var(--white);\n    border: 1px solid var(--surface-shell);\n    overflow: hidden;",
     "    background: var(--white);\n    border: 1px solid var(--surface-shell);\n    box-shadow: var(--shadow-soft);\n    overflow: hidden;"),
    ("    background: var(--ink);\n    box-shadow: var(--shadow-soft);",
     "    background: var(--ink);\n    box-shadow: var(--shadow);"),
    ("    background: var(--white);\n    box-shadow: var(--shadow-modal);\n  }\n  .confirm-dialog h2 {",
     "    background: var(--white);\n    box-shadow: var(--shadow);\n  }\n  .confirm-dialog h2 {"),
    ("  .has-selection {\n    border-bottom-color: var(--line);\n  }",
     "  .has-selection {\n    border-top-color: var(--forest);\n    border-bottom-color: var(--line);\n  }"),
    ("  .has-selection .selection-dot { background: var(--forest); }",
     "  .has-selection .selection-dot { background: var(--forest); box-shadow: 0 0 0 5px var(--sage-pale); }"),
    ("    color: var(--forest);\n    border: 1px solid var(--surface-border);\n    font-size: .65rem;",
     "    color: var(--forest);\n    border: 1px solid var(--sage);\n    font-size: .65rem;"),
    ("    border-left: 2px solid var(--sage);\n    background: color-mix(in srgb, var(--advisory-bg), transparent 45%);",
     "    border-left: 3px solid var(--gold);\n    background: var(--advisory-bg);"),
    # this pass added then removed that transition: net no change vs the pre-state

    ("""  .type-stage.is-ended .live-stats { opacity: .62; }
  /* Focus *is* "typing now", so no JS state is needed for the chrome to step back.
     The text itself is never faded - dimming an 11px label to .5 composits to
     ~2.2:1, far below AA - so only the rule that frames the numbers goes, plus the
     large decorative heading above them. opacity/color only: nothing here can
     trigger layout while keystrokes land. */
  .type-stage:has(.typing-passage:focus) .live-stats div { border-right-color: transparent; }
  .type-stage:has(.typing-passage:focus) .typing-topbar h1 { opacity: .55; }""",
     """  .live-stats { transition: opacity .22s ease-out; }
  .type-stage.is-ended .live-stats { opacity: .62; }"""),
    ("    padding: clamp(2.25rem, 6.5vw, 6rem);", "    padding: clamp(2.5rem, 8vw, 7rem);"),
    ("    padding: clamp(1.85rem, 5.5vw, 4.5rem);", "    padding: clamp(2rem, 7vw, 5.5rem);"),
    ("    border-bottom: 1px solid color-mix(in srgb, var(--line), transparent 45%);\n    background: var(--surface-raised);\n    backdrop-filter: blur(10px);",
     "    border-bottom: 1px solid color-mix(in srgb, var(--line), transparent 20%);\n    background: var(--surface-raised);\n    backdrop-filter: blur(16px);"),
    ("    --shadow-modal: 0 30px 90px rgba(12, 22, 17, 0.24);",
     "    --shadow-modal: 0 30px 100px rgba(12, 22, 17, 0.35);"),
    ("""    border: 1px solid var(--sage);
    border-radius: 50%;
  }
  .mistake-list {""", """    border: 1px solid var(--sage);
    border-radius: 50%;
    box-shadow: 0 0 0 9px var(--sage-pale), 0 0 0 10px var(--sage);
  }
  .mistake-list {"""),
    ("  .import-composition { grid-template-columns: 1fr; gap: 2.5rem; padding-top: 4rem; }",
     "  .import-composition { grid-template-columns: 1fr; gap: 2.5rem; padding-top: 4rem; }\n  .import-stage::before { inset: 0; }"),
]
# block insertions (before-state had whole rules that this pass deleted)
CSS_INSERT = [
    ("  .drop-zone {\n    min-height: 410px;", """  .import-stage::before {
    content: '';
    position: absolute;
    inset: 0 52% 0 0;
    opacity: .34;
    background-image:
      repeating-linear-gradient(0deg, transparent 0 31px, rgba(34,75,60,.085) 31px 32px),
      linear-gradient(90deg, rgba(255,253,248,.5), transparent);
    pointer-events: none;
  }
"""),
    ("  .document-preview:focus-visible", """  .success-label {
    margin-left: .9rem;
    color: var(--forest);
    font-size: .75rem;
    font-weight: 800;
  }
  .success-label i {
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: .35rem;
    background: var(--success-dot);
    border-radius: 50%;
  }
"""),
    ("  .parse-status p {", """  .privacy-lock {
    flex: 0 0 auto;
    width: 14px;
    height: 12px;
    margin-top: 5px;
    border: 1.5px solid var(--forest);
    position: relative;
  }
  .privacy-lock::before {
    content: '';
    position: absolute;
    width: 8px;
    height: 7px;
    left: 1.5px;
    top: -7px;
    border: 1.5px solid var(--forest);
    border-bottom: 0;
    border-radius: 7px 7px 0 0;
  }
"""),
    ("    --selection-bg: #c9dacb;", "    --success-dot: #538064;\n"),
]
HTML_INSERT = [
    ('        <article class="document-preview"',
     '          <span class="success-label"><i aria-hidden="true"></i> Ready</span>\n'),
    ("            <div class=\"privacy-note\">\n",
     "            <div class=\"privacy-note\">\n              <span class=\"privacy-lock\" aria-hidden=\"true\"></span>\n"),
]


def build_before():
    css, html = AFTER
    for after, before in CSS_INV:
        assert css.count(after) == 1, f"css anchor x{css.count(after)}: {after[:60]!r}"
        css = css.replace(after, before)
    for anchor, block in CSS_INSERT:
        assert css.count(anchor) == 1, f"css insert anchor x{css.count(anchor)}: {anchor[:50]!r}"
        css = css.replace(anchor, block + anchor, 1)
    for anchor, block in HTML_INSERT:
        assert html.count(anchor) == 1, f"html anchor x{html.count(anchor)}: {anchor[:50]!r}"
        html = html.replace(anchor, block + anchor, 1)
    return css, html


def run(label):
    out = subprocess.run(['bash', '-lc', f'cd /home/user/tools && node ab.mjs {label}'],
                         capture_output=True, text=True)
    if out.returncode:
        raise SystemExit(f"ab.mjs {label} failed:\n{out.stdout[-800:]}\n{out.stderr[-800:]}")
    return json.loads(out.stdout.strip().splitlines()[-1])


def main():
    before_css, before_html = build_before()
    pathlib.Path('/tmp/B.css').write_text(before_css)
    pathlib.Path('/tmp/B.html').write_text(before_html)
    print('pre-state reconstructed: all', len(CSS_INV) + len(CSS_INSERT) + len(HTML_INSERT),
          'inversions matched exactly once')
    results = {}
    try:
        CSS.write_text(before_css); HTML.write_text(before_html)
        import time; time.sleep(1.6)
        results['before'] = run('before')
        CSS.write_text(AFTER[0]); HTML.write_text(AFTER[1])
        time.sleep(1.6)
        results['after'] = run('after')
    finally:
        CSS.write_text(AFTER[0]); HTML.write_text(AFTER[1])
        print('tree restored to current state:',
              CSS.read_text() == AFTER[0] and HTML.read_text() == AFTER[1])

    a, b = results['before'], results['after']
    print(f"\n{'stage':9}{'nodes':>11}{'shadows':>11}{'borders':>11}{'pseudo':>10}{'accents':>11}{'maxBdr':>10}")
    for k in ('import', 'select', 'type'):
        def cell(n, fmt='{}->{}'):
            return fmt.format(a[k][n], b[k][n])
        print(f"{k:9}{cell('nodes'):>11}{cell('shadows'):>11}{cell('borderNodes'):>11}"
              f"{cell('pseudo'):>10}{len(a[k]['hues']):>4}->{b[k] and len(b[k]['hues']):<5}"
              f"{cell('maxBorderPx', '{}->{}px'):>10}")
    print('\npainted accent fill (px^2 of non-neutral background inside the stage):')
    for k in ('import', 'select', 'type'):
        b4, af = a[k]['accentArea'] or {}, b[k]['accentArea'] or {}
        keys = sorted(set(b4) | set(af), key=lambda x: -(b4.get(x,0)+af.get(x,0)))
        tot_b, tot_a = sum(b4.values()), sum(af.values())
        print(f"  {k:8} total {tot_b:>8.0f} -> {tot_a:>8.0f}" +
              ''.join(f"   {x} {b4.get(x,0):.0f}->{af.get(x,0):.0f}" for x in keys))
    print()
    for k in ('import', 'select', 'type'):
        print(f"{k:9}before accents: {', '.join(a[k]['hues'])}")
        print(f"{'':9}after  accents: {', '.join(b[k]['hues'])}")
    print()
    print('focus before:', a['focus']['before'], '->', a['focus']['after'])
    print('focus after :', b['focus']['before'], '->', b['focus']['after'], 'active:', b['focus'].get('active'))


if __name__ == '__main__':
    main()
