import { containRect, mapBox } from './box-layout';

describe('containRect', () => {
  it('letterboxes a wide image vertically', () => {
    // 900x600 into 300x300: scale 1/3 -> 300x200, centred with 50px bands.
    expect(containRect({ width: 900, height: 600 }, { width: 300, height: 300 }))
      .toEqual({ left: 0, top: 50, width: 300, height: 200 });
  });

  it('pillarboxes a tall image horizontally', () => {
    expect(containRect({ width: 600, height: 900 }, { width: 300, height: 300 }))
      .toEqual({ left: 50, top: 0, width: 200, height: 300 });
  });

  it('returns an empty rect before layout is known', () => {
    expect(containRect({ width: 900, height: 600 }, { width: 0, height: 0 }))
      .toEqual({ left: 0, top: 0, width: 0, height: 0 });
  });
});

describe('mapBox', () => {
  const image = { width: 900, height: 600 };
  const shown = { left: 0, top: 50, width: 300, height: 200 };

  it('scales backend pixels onto the displayed rect', () => {
    expect(mapBox({ x1: 90, y1: 60, x2: 450, y2: 300 }, image, shown))
      .toEqual({ left: 30, top: 70, width: 120, height: 80 });
  });

  it('clamps boxes that spill past the image edge', () => {
    expect(mapBox({ x1: -10, y1: 0, x2: 1000, y2: 600 }, image, shown))
      .toEqual({ left: 0, top: 50, width: 300, height: 200 });
  });
});
