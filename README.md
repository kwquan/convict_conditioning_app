# Ironworks — GitHub Pages deployment

A Convict Conditioning workout tracker, built around the book's "Good
Behavior" 3-day/week program (Mon: Pushups + Leg Raises · Wed: Pull-ups +
Squats · Fri: Handstand Pushups + Bridges), plus a cardio slot on each
training day.

## Deploy it

1. Create a new GitHub repository (or use an existing one).
2. Copy **every file in this folder** into the repo root (or into a `/docs`
   folder if you'd rather keep them out of the root):
   - `index.html`
   - `bundle.js`
   - `favicon.svg`, `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `favicon-48.png`
   - `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`
   - `site.webmanifest`
   - `.nojekyll`
3. Commit and push.
4. In the repo, go to **Settings → Pages**, set **Source** to the branch
   and folder you used, and save.
5. GitHub will give you a URL like `https://<username>.github.io/<repo>/`
   within a minute or two.

## iPhone home screen icon

Open the deployed site in Safari on iPhone, tap the Share icon, then
**Add to Home Screen**. It'll use `apple-touch-icon.png` (the anvil mark)
and launch full-screen using the name "Ironworks", thanks to the
`apple-touch-icon` link and `apple-mobile-web-app-*` meta tags already
wired up in `index.html`.

## Notes

- Data is stored in the browser's `localStorage`, scoped to whatever domain
  you deploy to. There's no server or account, so it stays on the device
  you use it on and won't sync across devices.
- Records older than 1 year are automatically pruned on save.
- Everything (React, app logic, styling) is bundled into `bundle.js`;
  Tailwind loads at runtime from the Tailwind CDN, and the Oswald/Inter
  fonts load from Google Fonts — both need an internet connection the
  first time the page loads.
