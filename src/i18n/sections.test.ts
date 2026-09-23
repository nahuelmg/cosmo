import { describe, expect, it } from 'vitest';
import { localizedSection, resolveSection, sectionKeys } from './sections';
import { routing } from './routing';
import { withBasePath } from '../config/paths';

describe('static localized routes', () => {
  it('round trips every localized section', () => {
    for (const locale of routing.locales) {
      for (const section of sectionKeys) {
        expect(resolveSection(localizedSection(section, locale), locale)).toBe(section);
      }
    }
  });
  it('rejects paths in the wrong language and unknown sections', () => {
    expect(resolveSection('people', 'es')).toBeUndefined();
    expect(resolveSection('personas', 'en')).toBeUndefined();
    expect(resolveSection('missing', 'es')).toBeUndefined();
    expect(localizedSection('people', 'es')).toBe('personas');
  });
});

describe('project Pages asset paths', () => {
  it('prefixes public assets exactly once', () => {
    expect(withBasePath('/people/photo.jpg')).toBe('/cosmo/people/photo.jpg');
    expect(withBasePath('people/photo.jpg')).toBe('/cosmo/people/photo.jpg');
    expect(withBasePath('/cosmo/people/photo.jpg')).toBe('/cosmo/people/photo.jpg');
    expect(withBasePath('/')).toBe('/cosmo/');
  });
  it('preserves external URLs and fragments', () => {
    for (const value of ['https://example.com/photo.jpg', '//example.com/photo.jpg', '#main-content', 'data:image/png;base64,abc']) {
      expect(withBasePath(value)).toBe(value);
    }
  });
});
