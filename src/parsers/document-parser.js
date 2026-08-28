import mammoth from 'mammoth';
import { marked } from 'marked';
import { sanitizeDocumentHTML } from '../security/sanitizer.js';
import { cleanPracticeText, countCharacters, countWords } from '../core/text.js';

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = new Set(['txt', 'md', 'docx']);

export class DocumentParseError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DocumentParseError';
    this.code = code;
  }
}

export function extensionFromName(name) {
  return String(name ?? '').split('.').pop()?.toLocaleLowerCase() || '';
}

export function validateDocumentFile(file) {
  const extension = extensionFromName(file?.name);
  if (extension === 'doc') {
    throw new DocumentParseError(
      'legacy-doc',
      'This is a legacy Word .doc file. For safe browser-based reading, save or convert it to .docx, .md, or .txt, then try again.',
    );
  }
  if (!ACCEPTED_EXTENSIONS.has(extension)) {
    throw new DocumentParseError('unsupported', 'Choose a .txt, .md, or .docx document.');
  }
  if (!file || file.size === 0) {
    throw new DocumentParseError('empty', 'This file is empty. Choose a document that contains readable text.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new DocumentParseError('too-large', 'This file is larger than 25 MB. Choose a smaller document.');
  }
  return extension;
}

function decodeTextFile(buffer) {
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return decoded.replace(/^\uFEFF/, '');
  } catch {
    try {
      return new TextDecoder('windows-1252', { fatal: true }).decode(buffer);
    } catch {
      throw new DocumentParseError('encoding', 'The text encoding could not be read. Save the file as UTF-8 and try again.');
    }
  }
}

function textToSafeHTML(text) {
  const wrapper = document.createElement('div');
  wrapper.className = 'plain-text';
  wrapper.textContent = text;
  return sanitizeDocumentHTML(wrapper.outerHTML);
}

async function parseDocx(buffer) {
  try {
    const result = await mammoth.convertToHtml(
      { arrayBuffer: buffer },
      {
        includeEmbeddedStyleMap: false,
        externalFileAccess: false,
        convertImage: mammoth.images.dataUri,
      },
    );
    return {
      html: sanitizeDocumentHTML(result.value),
      warnings: result.messages.filter(({ type }) => type === 'warning').map(({ message }) => message),
    };
  } catch {
    throw new DocumentParseError('corrupt-docx', 'This .docx file could not be read. It may be damaged or password-protected. Try opening and resaving it in your word processor.');
  }
}

export async function parseDocument(file) {
  const extension = validateDocumentFile(file);
  let buffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    throw new DocumentParseError('read-failed', 'The browser could not read this file. Check its permissions and try again.');
  }

  let html = '';
  let warnings = [];
  if (extension === 'txt') {
    html = textToSafeHTML(decodeTextFile(buffer));
  } else if (extension === 'md') {
    const markdown = decodeTextFile(buffer);
    html = sanitizeDocumentHTML(marked.parse(markdown, { gfm: true, breaks: false }));
  } else {
    ({ html, warnings } = await parseDocx(buffer));
  }

  const container = document.createElement('div');
  container.innerHTML = html;
  const text = cleanPracticeText(container.textContent || '');
  if (!text || countWords(text) === 0) {
    throw new DocumentParseError('no-text', 'No readable text was found. The document may contain only images or unsupported objects.');
  }

  return {
    name: file.name,
    extension,
    html,
    warnings,
    approximateWords: countWords(text),
    approximateCharacters: countCharacters(text),
  };
}