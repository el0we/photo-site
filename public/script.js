// Gallery: reads photos.json, shows a justified grid of thumbnails (photos/thumbs/),
// and opens a full-screen viewer (arrows, swipe, keyboard, camera-info button).
// Photos whose files are missing are skipped, so the site never shows broken images.
(function () {
  var grid = document.getElementById('grid');
  var empty = document.getElementById('empty');
  var box = document.getElementById('lightbox');
  var main = document.getElementById('main');
  var title = document.getElementById('title');
  var count = document.getElementById('count');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');
  var closeBtn = document.getElementById('close');
  var infoBtn = document.getElementById('info-btn');
  var info = document.getElementById('info');
  var items = [];
  var cur = 0;
  var opener = null;

  // Find a loadable image for each entry: its thumbnail, else the full photo.
  function probe(p) {
    function load(src) {
      return new Promise(function (resolve) {
        var im = new Image();
        im.onload = function () { resolve({ src: src, w: im.naturalWidth, h: im.naturalHeight }); };
        im.onerror = function () { resolve(null); };
        im.src = src;
      });
    }
    return load('photos/thumbs/' + p.file).then(function (r) {
      return r || load('photos/' + p.file);
    }).then(function (r) {
      if (!r) return null;
      p.thumb = r.src;
      p.ar = (r.w / r.h).toFixed(4);
      return p;
    });
  }

  // ----- camera details -----
  function setInfo(open) {
    infoBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    info.hidden = !open;
  }

  function renderInfo(p) {
    info.textContent = '';
    var keys = p.info ? Object.keys(p.info) : [];
    keys.forEach(function (k) {
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = k;
      dd.textContent = p.info[k];
      info.appendChild(dt);
      info.appendChild(dd);
    });
    infoBtn.hidden = !keys.length;
    if (!keys.length) setInfo(false);
  }

  // ----- full-screen viewer -----
  function show(i) {
    cur = (i + items.length) % items.length;
    var p = items[cur];
    main.classList.remove('in');
    main.onload = function () { main.classList.add('in'); };
    main.src = 'photos/' + p.file;
    main.alt = p.alt || p.title;
    title.textContent = p.title;
    renderInfo(p);
    count.textContent = items.length > 1 ? (cur + 1) + ' / ' + items.length : '';
    if (main.complete && main.naturalWidth) main.classList.add('in');
    [cur + 1, cur - 1].forEach(function (k) {   // warm the neighbours
      new Image().src = 'photos/' + items[(k + items.length) % items.length].file;
    });
  }

  function openBox(i, from) {
    opener = from || null;
    prev.hidden = next.hidden = items.length < 2;
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    show(i);
    closeBtn.focus();
  }

  function closeBox() {
    if (box.hidden) return;
    box.hidden = true;
    setInfo(false);
    main.removeAttribute('src');
    document.body.style.overflow = '';
    if (opener) opener.focus();
  }

  // ----- grid -----
  function build() {
    if (!items.length) {
      grid.hidden = true;
      empty.hidden = false;
      return;
    }
    items.forEach(function (p, k) {
      var li = document.createElement('li');
      li.style.setProperty('--ar', p.ar);
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'View ' + p.title);
      var im = new Image();
      im.alt = p.alt || p.title;
      im.onload = function () { im.classList.add('in'); };
      im.src = p.thumb;
      if (im.complete) im.classList.add('in');
      var t = document.createElement('span');
      t.className = 't';
      t.textContent = p.title;
      b.appendChild(im);
      b.appendChild(t);
      b.addEventListener('click', function () { openBox(k, b); });
      li.appendChild(b);
      grid.appendChild(li);
    });
  }

  closeBtn.addEventListener('click', closeBox);
  infoBtn.addEventListener('click', function () { setInfo(info.hidden); });
  prev.addEventListener('click', function () { show(cur - 1); });
  next.addEventListener('click', function () { show(cur + 1); });

  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') { if (!info.hidden) setInfo(false); else closeBox(); }
    else if (e.key === 'ArrowLeft' && items.length > 1) show(cur - 1);
    else if (e.key === 'ArrowRight' && items.length > 1) show(cur + 1);
    else if (e.key === 'Tab') {                    // keep focus inside the viewer
      var f = Array.prototype.filter.call(box.querySelectorAll('button'), function (el) { return !el.hidden; });
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  var x0 = null;
  main.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  main.addEventListener('touchend', function (e) {
    if (x0 === null || items.length < 2) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  fetch('photos.json')
    .then(function (r) { return r.json(); })
    .then(function (list) { return Promise.all(list.map(probe)); })
    .then(function (res) { items = res.filter(Boolean); build(); })
    .catch(function () { build(); });
})();
