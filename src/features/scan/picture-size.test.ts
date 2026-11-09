import { pickScanPictureSize } from './picture-size';

describe('pickScanPictureSize', () => {
  it('picks the smallest 4:3 size that covers the AI input', () => {
    expect(pickScanPictureSize(['4000x3000', '1600x1200', '2048x1536', '1280x960']))
      .toBe('1600x1200');
  });

  it('ignores other aspect ratios', () => {
    expect(pickScanPictureSize(['1920x1080', '1600x1600', '2560x1920'])).toBe('2560x1920');
  });

  it('accepts portrait-ordered sizes', () => {
    expect(pickScanPictureSize(['1200x1600'])).toBe('1200x1600');
  });

  it('keeps the camera default when nothing qualifies', () => {
    expect(pickScanPictureSize(['1280x960', '1920x1080', 'High'])).toBeUndefined();
    expect(pickScanPictureSize([])).toBeUndefined();
  });
});
