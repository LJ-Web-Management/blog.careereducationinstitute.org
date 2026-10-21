// Blog index and category pages: search and sort the posts in place. Search and sort are kept in the address
// (?q=...&sort=...) so a filtered list can be shared or bookmarked.
(function () {
  var list = document.querySelector('[data-posts]');
  var form = document.querySelector('[data-blog-search]');
  if (!list || !form) return;
  var items = [].slice.call(list.children);
  var q = document.getElementById('blog-q'), sort = document.getElementById('blog-sort');
  var empty = document.querySelector('[data-empty]'), count = document.querySelector('[data-count]');
  var total = items.length;
  var norm = function (s) { return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' '); };
  var order = {
    'new': function (a, b) { return b.getAttribute('data-date').localeCompare(a.getAttribute('data-date')); },
    old: function (a, b) { return a.getAttribute('data-date').localeCompare(b.getAttribute('data-date')); },
    az: function (a, b) { return a.getAttribute('data-title').localeCompare(b.getAttribute('data-title')); },
    za: function (a, b) { return b.getAttribute('data-title').localeCompare(a.getAttribute('data-title')); }
  };
  var run = function () {
    var words = norm(q.value).trim().split(/\s+/).filter(Boolean), shown = 0;
    items.forEach(function (li) {
      var hay = norm(li.getAttribute('data-text'));
      var ok = words.every(function (w) { return hay.indexOf(w) > -1; });
      li.hidden = !ok;
      if (ok) shown++;
    });
    items.slice().sort(order[sort.value] || order['new']).forEach(function (li) { list.appendChild(li); });
    empty.hidden = shown > 0;
    count.textContent = words.length ? shown + ' of ' + total + ' articles match “' + q.value.trim() + '”' : total + (total === 1 ? ' article' : ' articles');
    var u = new URL(location.href);
    if (q.value.trim()) u.searchParams.set('q', q.value.trim()); else u.searchParams.delete('q');
    if (sort.value !== 'new') u.searchParams.set('sort', sort.value); else u.searchParams.delete('sort');
    history.replaceState(null, '', u.pathname + u.search);
  };
  document.querySelector('.bi-sort').hidden = false;
  var p = new URLSearchParams(location.search);
  if (p.get('q')) q.value = p.get('q');
  if (order[p.get('sort')]) sort.value = p.get('sort');
  form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  q.addEventListener('input', run);
  sort.addEventListener('change', run);
  if (p.get('q') || p.get('sort')) run();
})();
