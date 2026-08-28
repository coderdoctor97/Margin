import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { parseDocument, validateDocumentFile } from '../src/parsers/document-parser.js';
import { createDocxFixture, fixtureFile } from './fixtures/docx-fixture.js';

async function textFixture(name, type) {
  const bytes = await readFile(new URL(`./fixtures/${name}`, import.meta.url));
  return fixtureFile(bytes, name, type);
}

describe('document parsing', () => {
  it('extracts TXT while preserving authored line breaks', async () => {
    const result = await parseDocument(await textFixture('sample.txt', 'text/plain'));
    expect(result.extension).toBe('txt');
    expect(result.html).toContain('The first paragraph');
    expect(result.html).toContain('\n\nThe second paragraph');
    expect(result.approximateWords).toBeGreaterThan(10);
  });

  it('renders Markdown headings, emphasis, lists, links, and tables', async () => {
    const result = await parseDocument(await textFixture('sample.md', 'text/markdown'));
    expect(result.html).toContain('<h1>A Small Lesson</h1>');
    expect(result.html).toContain('<strong>carefully</strong>');
    expect(result.html).toContain('<ul>');
    expect(result.html).toContain('<table>');
    expect(result.html).toContain('rel="noopener noreferrer"');
  });

  it('extracts readable structure from a local DOCX fixture', async () => {
    const bytes = createDocxFixture();
    const result = await parseDocument(fixtureFile(bytes, 'notes.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
    expect(result.html).toContain('<h1>Practice Notes</h1>');
    expect(result.html).toContain('<strong>carefully</strong>');
    expect(result.html).toContain('<table>');
    expect(result.approximateWords).toBeGreaterThanOrEqual(7);
  });

  it('rejects empty, oversized, unsupported, and legacy DOC files clearly', () => {
    expect(() => validateDocumentFile({ name: 'empty.txt', size: 0 })).toThrow(/empty/i);
    expect(() => validateDocumentFile({ name: 'huge.md', size: 26 * 1024 * 1024 })).toThrow(/25 MB/i);
    expect(() => validateDocumentFile({ name: 'slides.pdf', size: 10 })).toThrow(/\.txt/i);
    expect(() => validateDocumentFile({ name: 'legacy.doc', size: 10 })).toThrow(/legacy Word \.doc/i);
  });
});