import createDOMPurify from 'dompurify';

function getPurifier() {
  return typeof createDOMPurify.sanitize === 'function'
    ? createDOMPurify
    : createDOMPurify(globalThis.window);
}

const SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['style'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

export function sanitizeDocumentHTML(untrustedHTML) {
  const purifier = getPurifier();
  const clean = purifier.sanitize(String(untrustedHTML ?? ''), SANITIZE_OPTIONS);
  const template = document.createElement('template');

  // This HTML has already passed through DOMPurify; the second pass below
  // covers the safe attributes added while hardening links.
  template.innerHTML = clean;
  template.content.querySelectorAll('a').forEach((link) => {
    link.setAttribute('rel', 'noopener noreferrer');
    link.setAttribute('target', '_blank');
  });
  template.content.querySelectorAll('img').forEach((image) => {
    const source = image.getAttribute('src') || '';
    if (!/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(source)) {
      const replacement = document.createTextNode(image.getAttribute('alt') || '');
      image.replaceWith(replacement);
    }
  });

  return purifier.sanitize(template.innerHTML, {
    ...SANITIZE_OPTIONS,
    ADD_ATTR: ['target'],
  });
}