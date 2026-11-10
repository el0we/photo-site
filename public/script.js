// Slideshow: reads photos.json and shows every photo that exists in /photos/.
// Photos not uploaded yet are skipped, so the site never shows broken images.
(function () {
  var main = document.getElementById('main');
  var title = document.getElementById('title');
  var count = document.getElementById('count');
  var thumbs = document.getElementById('thumbs');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');
  var empty = document.getElementById('empty');
  var items = [];
  var cur = 0;

  function probe(p) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { resolve(p); };
      im.onerror = function () { resolve(null); };
      im.src = 'photos/' + p.file;
    });
  }

  function show(i) {
    cur = (i + items.length) % items.length;
    var p = items[cur];
    main.classList.remove('in');
    main.onload = function () { main.classList.add('in'); };
    main.src = 'photos/' + p.file;
    main.alt = p.alt || p.title;
    title.textContent = p.title;
    count.textContent = items.length > 1 ? (cur + 1) + ' / ' + items.length : '';
    Array.prototype.forEach.call(thumbs.children, function (b, k) {
      b.classList.toggle('on', k === cur);
    });
    if (main.complete) main.classList.add('in');
  }

  function build() {
    if (!items.length) {
      document.querySelector('.stage').hidden = true;
      document.querySelector('.caption').hidden = true;
      empty.hidden = false;
      return;
    }
    items.forEach(function (p, k) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', p.title);
      var t = new Image();
      t.src = 'photos/' + p.file;
      t.alt = '';
      t.loading = 'lazy';
      b.appendChild(t);
      b.addEventListener('click', function () { show(k); });
      thumbs.appendChild(b);
    });
    if (items.length > 1) { prev.hidden = next.hidden = thumbs.hidden = false; }
    show(0);
  }

  prev.addEventListener('click', function () { show(cur - 1); });
  next.addEventListener('click', function () { show(cur + 1); });
  document.addEventListener('keydown', function (e) {
    if (items.length < 2) return;
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
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
