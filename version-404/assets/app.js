(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMobileMenu() {
    var button = qs('.mobile-menu-button');
    var panel = qs('.mobile-panel');

    if (!button || !panel) {
      return;
    }

    button.addEventListener('click', function () {
      var expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      panel.hidden = expanded;
    });
  }

  function setupHero() {
    var hero = qs('.hero-carousel');

    if (!hero) {
      return;
    }

    var slides = qsa('.hero-slide', hero);
    var dots = qsa('.hero-dot', hero);
    var prev = qs('.hero-prev', hero);
    var next = qs('.hero-next', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        play();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        play();
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        play();
      });
    });

    show(0);
    play();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function setupFilters() {
    var grids = qsa('[data-filter-grid]');

    grids.forEach(function (grid) {
      var section = grid.closest('section') || document;
      var input = qs('.filter-input', section) || qs('.filter-input');
      var buttons = qsa('[data-filter]', section);
      var activeFilter = 'all';

      function apply() {
        var query = normalize(input ? input.value : '');
        var visible = 0;

        qsa('.movie-card', grid).forEach(function (card) {
          var text = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-text'),
            card.getAttribute('data-year'),
            card.getAttribute('data-region')
          ].join(' '));
          var category = card.getAttribute('data-category') || '';
          var matchesQuery = !query || text.indexOf(query) !== -1;
          var matchesFilter = activeFilter === 'all' || category === activeFilter || text.indexOf(normalize(activeFilter)) !== -1;
          var show = matchesQuery && matchesFilter;
          card.hidden = !show;

          if (show) {
            visible += 1;
          }
        });
      }

      if (input) {
        var params = new URLSearchParams(window.location.search);
        var q = params.get('q');

        if (q && !input.value) {
          input.value = q;
        }

        input.addEventListener('input', apply);
      }

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          activeFilter = button.getAttribute('data-filter') || 'all';
          buttons.forEach(function (item) {
            item.classList.toggle('is-active', item === button);
          });
          apply();
        });
      });

      apply();
    });
  }

  function setupImages() {
    qsa('img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.classList.add('image-missing');
      });
    });
  }

  window.initMoviePlayer = function (source, rootId) {
    var root = document.getElementById(rootId);

    if (!root) {
      return;
    }

    var video = qs('video', root);
    var overlay = qs('.player-overlay', root);
    var hls = null;

    if (!video) {
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
    } else {
      video.src = source;
    }

    function start() {
      if (!video.src && !(window.Hls && window.Hls.isSupported())) {
        video.src = source;
      }

      var promise = video.play();

      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
    }

    function toggle() {
      if (video.paused) {
        start();
      } else {
        video.pause();
      }
    }

    if (overlay) {
      overlay.addEventListener('click', start);
    }

    video.addEventListener('click', toggle);
    video.addEventListener('play', function () {
      root.classList.add('is-playing');
    });
    video.addEventListener('pause', function () {
      root.classList.remove('is-playing');
    });
    video.addEventListener('ended', function () {
      root.classList.remove('is-playing');
    });
    window.addEventListener('pagehide', function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupHero();
    setupFilters();
    setupImages();
  });
})();
