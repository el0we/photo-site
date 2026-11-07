# elowe.co photo site

Plain static site: no build step.

- Photos live in `photos/`. The slideshow on the home page shows every photo
  listed in `photos.json` whose file exists; missing files are skipped.
- To add a photo: drop the file in `photos/` and add an entry to `photos.json`
  (the order in that file is the slideshow order).
- Cloudflare Pages settings: framework preset **None**, build command empty,
  output directory `/`.
