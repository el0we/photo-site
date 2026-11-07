// Gallery: reads photos.json and shows each photo from /photos/.
// If a file isn't there yet, a placeholder tile shows instead.
(function () {
  var grid = document.getElementById('grid');
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbCap = document.getElementById('lb-cap');

  function placeholder(p, i) {
    var d = document.createElement('div');
    d.className = 'tile empty' + (i % 3 === 1 ? ' tall' : '');
    d.textContent = p.title + ' (photo coming soon)';
    return d;
  }

  function tile(p, i) {
    var fig = document.createElement('figure');
    fig.className = 'tile';
    fig.style.margin = '0 0 1rem';
    var img = new Image();
    img.loading = 'lazy';
    img.alt = p.alt || p.title;
    img.onload = function () {
      fig.appendChild(img);
      fig.addEventListener('click', function () {
        lbImg.src = img.src; lbImg.alt = img.alt; lbCap.textContent = p.title;
        lb.hidden = false;
      });
    };
    img.onerror = function () { fig.replaceWith(placeholder(p, i)); };
    img.src = 'photos/' + p.file;
    return fig;
  }

  fetch('photos.json')
    .then(function (r) { return r.json(); })
    .then(function (list) { list.forEach(function (p, i) { grid.appendChild(tile(p, i)); }); })
    .catch(function () { grid.textContent = 'Gallery unavailable.'; });

  function close() { lb.hidden = true; lbImg.src = ''; }
  document.getElementById('lb-close').addEventListener('click', close);
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
