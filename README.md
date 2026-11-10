# elowe.co photo site

Plain static site, no build step. Everything published lives in `public/`.

- The home page is a justified grid of every photo listed in `public/photos.json`
  whose file exists (missing files are skipped). Clicking a photo opens a full-screen
  viewer with arrows, swipe, keyboard (arrows / Esc) and an info button for camera details.
- To add a photo: drop the file in `public/photos/`, run `python3 tools/make_thumbs.py`
  (makes the small grid copy in `public/photos/thumbs/`), and add an entry to
  `public/photos.json`. The order in that file is the grid and viewer order.
  An optional `"info"` object (Camera, Lens, Focal length, Aperture, Shutter, ISO, Date)
  turns on the info button for that photo.
- If you replace a photo, re-run `python3 tools/make_thumbs.py --force`.
- `wrangler.jsonc` points Cloudflare at `public/`. Deploy: Cloudflare Workers
  static assets, no build command, deploy command `npx wrangler deploy`.
  Every push to `main` publishes.
- `public/_headers`: security headers and photo caching.
