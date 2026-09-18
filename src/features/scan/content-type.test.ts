import { resolveContentType } from './content-type';
import { primaryIpa, translationFor } from './display';

describe('resolveContentType', () => {
  it('accepts the types the backend supports', () => {
    expect(resolveContentType('file:///a.jpg', 'image/jpeg')).toBe('image/jpeg');
    expect(resolveContentType('file:///a.webp', 'image/webp')).toBe('image/webp');
  });

  it('normalises the non-standard image/jpg', () => {
    expect(resolveContentType('file:///a', 'image/JPG')).toBe('image/jpeg');
  });

  it('falls back to the extension when the picker gives no MIME type', () => {
    expect(resolveContentType('file:///cache/photo.PNG', undefined)).toBe('image/png');
    expect(resolveContentType('file:///cache/photo.jpeg?x=1', '')).toBe('image/jpeg');
  });

  it('rejects what the backend would reject', () => {
    expect(resolveContentType('file:///a.heic', 'image/heic')).toBeNull();
    expect(resolveContentType('file:///a.gif', undefined)).toBeNull();
  });
});

describe('dictionary display helpers', () => {
  const word = {
    exists: true,
    word: 'bottle',
    langCode: 'en',
    langName: 'English',
    pronunciations: [{ ipa: 'ˈbɒtl', region: 'UK' }],
    meanings: [],
    translations: [{ langCode: 'vi', translation: 'cái chai' }],
  };

  it('wraps the IPA in slashes', () => {
    expect(primaryIpa(word)).toBe('/ˈbɒtl/');
    expect(primaryIpa(null)).toBeNull();
  });

  it('picks the Vietnamese translation', () => {
    expect(translationFor(word)).toBe('cái chai');
    expect(translationFor({ ...word, translations: null })).toBeNull();
  });
});
