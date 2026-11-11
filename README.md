# elowe.co photo site

Plain static site, no build step. Everything published lives in `public/`.

- The home page is a justified grid of every photo listed in `public/photos.json`
  whose file exists (missing files are skipped). Clicking a photo opens a full-screen
  viewer with arrows, swipe, keyboard (arrows / Esc) and an info button for camera details.
- To add a photo: drop the file in `public/photos/`, run `python3 tools/prepare_photos.py`
  (makes the small grid copy in `public/photos/thumbs/`, strips camera/lens serial numbers
  and editing-software leftovers, and stamps the copyright notice into the file), and add an entry to
  `public/photos.json`. The order in that file is the grid and viewer order.
  An optional `"tags"` list (e.g. `["Street", "Architecture"]`) puts the photo under those
  filters at the top of the grid; a photo can have more than one. Filter buttons appear
  automatically for every tag in use (Street, Landscape, Architecture are listed first).
  An optional `"info"` object (Camera, Lens, Focal length, Aperture, Shutter, ISO, Date)
  turns on the info button for that photo.
- If you replace a photo, re-run `python3 tools/prepare_photos.py --force`.
  The script is lossless (no re-compression of the full photos) and safe to re-run.
  The copyright wording is at the top of the script.
- `wrangler.jsonc` points Cloudflare at `public/`. Deploy: Cloudflare Workers
  static assets, no build command, deploy command `npx wrangler deploy`.
  Every push to `main` publishes.
- `public/robots.txt`: asks AI-training crawlers to stay away (well-behaved bots only).
- `public/_headers`: security headers and photo caching.
