# elowe.co photo site

Plain static site, no build step. Everything published lives in `public/`.

- Photos live in `public/photos/`. The home page shows every photo listed in
  `public/photos.json` whose file exists; missing files are skipped.
- To add a photo: drop the file in `public/photos/` and add an entry to
  `public/photos.json` (the order in that file is the slideshow order).
  With more than one photo, arrows, swipe, keyboard and thumbnails turn on automatically.
- `wrangler.jsonc` points Cloudflare at `public/`. Deploy: Cloudflare Workers
  static assets, no build command, deploy command `npx wrangler deploy`.
  Every push to `main` publishes.
- `public/_headers`: security headers and photo caching.
