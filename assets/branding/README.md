# SnapVocab app icon

The user-provided fox/camera/book logo was cleaned with the built-in ImageGen
tool and exported by `scripts/export-app-icons.cjs`.

- `logo-master.png`: cleaned transparent master artwork.
- `icon-preview.png`: simulated circular, square and themed launcher icons,
  including a 48 px sample of each. This does not replace on-device QA.
- `../icon.png`: 1024 x 1024 opaque icon with the purple brand background.
- `../adaptive-icon.png`: 1024 x 1024 transparent adaptive foreground.
- `../adaptive-background.png`: full-bleed background layer.
- `../adaptive-monochrome.png`: matching alpha silhouette with lens cutout.
- `../splash-icon.png`: transparent artwork for the splash screen.
- `../favicon.png`: 64 x 64 web icon.

The complete adaptive foreground fits inside the central circular safe zone
(66/108 of the layer width). Colors, camera lens and book/fox identity are
preserved; isolated alpha export specks are removed during packaging.

ImageGen prompt:

> Edit the supplied orange fox-camera-book logo. Preserve its proportions,
> overlapping cards, fox ears, cream book pages and purple-blue lens. Sharpen
> edges and remove the purple square background and loose ground shadow to
> produce a transparent foreground. Do not redesign or add text or symbols.

Export from a transparent source:

```sh
node scripts/export-app-icons.cjs /path/to/transparent-logo.png
```
