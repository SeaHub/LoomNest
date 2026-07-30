# LoomNest

Where Ideas Become Reality.

## Vue site

The production site is a Vue 3 + Vite app. Start it locally with:

```bash
npm install
npm run dev
```

Build and preview the production bundle with:

```bash
npm run build
npm run preview
```

The deployed project URL is [https://seahub.github.io/LoomNest/](https://seahub.github.io/LoomNest/). GitHub Actions publishes every push to `main` through [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## Content operations

The editable content source is [`public/works.json`](public/works.json). Add or update a work record there and place its promotional image or QR artwork in [`public/assets/`](public/assets/). The site keeps the four access types from the approved prototype:

- `web`: `access.url`
- `mini-program`: `access.qrImage` and optional `access.qrAlt`
- `mobile`: `access.appStore` and/or `access.googlePlay`
- `future` or `status: "soon"`: shows `Coming Soon` without an invalid link

The site falls back to bundled example data if the JSON cannot be loaded, so a bad content edit does not leave a blank page.

## Prototype reference

The approved static interaction prototype remains in `prototype/` for visual reference. Its work list is configured in [`prototype/works.json`](prototype/works.json).

To preview only the original prototype:

```bash
python3 -m http.server 4173 --directory prototype
```

Then open `http://127.0.0.1:4173/`.
