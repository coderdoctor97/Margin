import { describe, expect, it } from 'vitest';
import { sanitizeDocumentHTML } from '../src/security/sanitizer.js';

describe('document HTML sanitization', () => {
  it('removes scripts and event handlers', () => {
    const clean = sanitizeDocumentHTML('<p onclick="alert(1)">Keep</p><script>alert(2)</script><img src="x" onerror="alert(3)">');
    expect(clean).toContain('Keep');
    expect(clean).not.toMatch(/script|onclick|onerror/i);
  });

  it('removes unsafe links and hardens safe links', () => {
    const clean = sanitizeDocumentHTML('<a href="javascript:alert(1)">bad</a><a href="https://example.com">safe</a>');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = clean;
    const [bad, safe] = wrapper.querySelectorAll('a');
    expect(bad.hasAttribute('href')).toBe(false);
    expect(safe.getAttribute('href')).toBe('https://example.com');
    expect(safe.getAttribute('rel')).toBe('noopener noreferrer');
    expect(safe.getAttribute('target')).toBe('_blank');
  });

  it('blocks remote image requests but retains embedded data images', () => {
    const clean = sanitizeDocumentHTML('<img alt="remote" src="https://tracker.test/pixel"><img alt="local" src="data:image/png;base64,AAAA">');
    expect(clean).toContain('remote');
    expect(clean).not.toContain('tracker.test');
    expect(clean).toContain('data:image/png;base64,AAAA');
  });
});