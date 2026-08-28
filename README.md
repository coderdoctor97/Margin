# Margin

Margin is a private, document-based typing practice application. Import a TXT, Markdown, or DOCX file, select any readable passage, and type against the unchanged source text. Mistyped target words are saved locally for focused review.

## Setup

Requirements: Node.js 20 or newer and npm 10 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Commands

```bash
npm run dev          # Start the Vite development server
npm test             # Run the Vitest suite once
npm run test:watch   # Run tests in watch mode
npm run build        # Create a production build in dist/
npm run preview      # Serve the production build locally
```

## Supported Documents

- `.txt`: decoded as UTF-8 first, with a Windows-1252 fallback. Authored paragraphs and line breaks are retained.
- `.md`: rendered with Marked using GitHub-Flavored Markdown support for headings, paragraphs, lists, emphasis, links, code blocks, and tables.
- `.docx` (including the `.dox` typo in the original request): converted to clean semantic HTML by Mammoth. Headings, paragraphs, lists, inline emphasis, tables, and supported embedded images are retained as readable content.
- `.doc`: recognized but not parsed. Legacy DOC is a different binary format and is not supported by Mammoth's DOCX parser. Margin asks the user to save or convert it to DOCX, Markdown, or TXT. Reliable full DOC support would require a separate conversion service or a substantially different browser conversion dependency, which is intentionally outside the local-only architecture.

Margin preserves meaningful readable structure, not pixel-perfect Microsoft Word page layout. Files larger than 25 MB, empty files, corrupt or password-protected DOCX files, and documents without usable text produce actionable errors.

## Security And Privacy

Document bytes are processed entirely in the browser and are not uploaded. The imported document and typing sessions are not written to browser storage. Replacing a document clears its preview and session state.

Generated Markdown and DOCX HTML passes through DOMPurify before insertion. Scripts, event-handler attributes, forms, embedded browsing contexts, unsafe protocols, and remote images are removed. Supported DOCX embedded images use local data URIs. External links are hardened with `noopener noreferrer` and open only after the user activates them.

Only mistake-word records and sound preferences use `localStorage`. Mistake records contain the target word, mistake count, session count, last-practiced date, and a short nearby context. Users can remove one word, clear all records, or export/import the versioned JSON schema.

## Typing Rules

1. Select **Start** to arm the session. Timing begins on the first evaluated printable keystroke, not when the session opens.
2. Printable Unicode input, spaces, punctuation, Enter for source line breaks, and Tab for table-cell separators are evaluated exactly against the source.
3. A correct or incorrect printable key advances one source character. Backspace revisits the preceding character, but it does not erase an already recorded mistake from the learning history or cumulative keystroke metrics.
4. Paste, modifier-only keys, and keyboard shortcuts are not evaluated. A paste attempt is blocked and announced accessibly.
5. Pause excludes paused time. Resume continues the same session. Restart clears current metrics but keeps mistake history. End Session reports the partial result.
6. Completion and 100% progress appear only after every source character has been evaluated under these rules.

Statistics use these formulas:

- `WPM = correct evaluated keystrokes / 5 / elapsed minutes`
- `Accuracy = correct evaluated keystrokes / total evaluated keystrokes * 100`
- `Progress = current source position / total source characters * 100`

Zero elapsed time produces 0 WPM. Before any evaluated keystroke, accuracy is shown as 100% because there are no errors to evaluate.

## Mistake Practice

When an incorrect character falls inside a Unicode letter/number word, Margin stores the target word rather than the typed spelling. Word matching includes combining marks, internal straight or curly apostrophes, and hyphenated segments. Standalone whitespace and punctuation never create blank records.

The Mistake Library can practice any checked words; **Select all** creates an all-words session. Every selected word appears once. Words with repeated mistakes receive up to two extra repetitions; extra weighting stops once a normal practice set reaches 120 words, while unusually large selections still keep every selected word.

The persisted schema is currently version 2. Missing, malformed, array-based legacy, and version 1 data are handled safely. Imported valid records merge with local counts.

## Keyboard Sound

Typing audio is enabled by default at 28% volume and can be changed in the header. Audio is unlocked only by a deliberate Start or sound-control interaction to comply with browser autoplay policies. The local PCM asset is decoded into a Web Audio buffer and uses limited polyphony so quick typing does not cut off every click or create unbounded overlap. Correct and incorrect evaluated printable keys use the same sound.

Asset details and licensing are in [`public/assets/audio/README.md`](public/assets/audio/README.md). The click is an original CC0 waveform created for this project; no external audio is hotlinked.

## Architecture

- `src/parsers/document-parser.js`: validation, encoding, TXT/Markdown/DOCX extraction
- `src/security/sanitizer.js`: DOMPurify policy and safe link/image post-processing
- `src/core/text.js`: selection cleanup, paragraph extraction, Unicode word mapping
- `src/core/typing-session.js`: explicit session state and character evaluation
- `src/core/statistics.js`: WPM, accuracy, progress, and elapsed formatting
- `src/storage/mistake-store.js`: schema migration, persistence, import/export, weighted practice
- `src/audio/keyboard-audio.js`: preference storage, audio unlock, decoding, and playback gating
- `src/main.js`: DOM rendering, user flow, accessibility announcements, and event wiring

The application uses semantic HTML, local CSS, and modular vanilla JavaScript. Vite bundles application dependencies for production. The interface remains functional without utility CSS; the Tailwind browser script present in the HTML is not used by application code.

## Tests

The Vitest suite covers TXT, Markdown, and generated local DOCX fixtures; hostile HTML sanitization; selection and paragraph cleanup; typing state transitions and metrics; Unicode word mapping; mistake schema behavior; and sound preference/playback gating.

The DOCX fixture is generated locally from minimal, non-copyrighted Open XML parts in `tests/fixtures/docx-fixture.js`. TXT and Markdown fixtures are original test prose.