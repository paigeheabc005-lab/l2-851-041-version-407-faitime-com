(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function initMobileMenu() {
    var button = document.querySelector('.menu-toggle');
    var nav = document.querySelector('.mobile-nav');

    if (!button || !nav) {
      return;
    }

    button.addEventListener('click', function () {
      var expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open', !expanded);
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');

    if (!hero) {
      return;
    }

    var slides = selectAll('[data-hero-slide]', hero);
    var dots = selectAll('[data-hero-dot]', hero);
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initLocalFilter() {
    var input = document.querySelector('[data-filter-input]');
    var list = document.querySelector('[data-filter-list]');

    if (!input || !list) {
      return;
    }

    var cards = selectAll('.movie-card', list);

    input.addEventListener('input', function () {
      var query = normalize(input.value);

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.getAttribute('data-tags')
        ].join(' '));

        card.setAttribute('data-filter-hidden', query && haystack.indexOf(query) === -1 ? 'true' : 'false');
      });
    });
  }

  function createSearchCard(movie) {
    var tags = String(movie.tags || movie.genre || '')
      .split(/[,，/、\s]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      })
      .join('');

    return [
      '<article class="movie-card">',
      '  <a class="poster-link" href="' + escapeHtml(movie.href) + '" aria-label="观看 ' + escapeHtml(movie.title) + '">',
      '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '    <span class="poster-badge">' + escapeHtml(movie.year) + '</span>',
      '    <span class="poster-play">▶</span>',
      '  </a>',
      '  <div class="movie-card-body">',
      '    <div class="movie-card-meta">',
      '      <span>' + escapeHtml(movie.region) + '</span>',
      '      <span>' + escapeHtml(movie.type) + '</span>',
      '    </div>',
      '    <h3><a href="' + escapeHtml(movie.href) + '">' + escapeHtml(movie.title) + '</a></h3>',
      '    <p>' + escapeHtml(movie.oneLine || '') + '</p>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initSearchPage() {
    var results = document.querySelector('[data-search-results]');
    var input = document.querySelector('[data-search-input]');
    var count = document.querySelector('[data-search-count]');
    var title = document.querySelector('[data-search-title]');

    if (!results || !input || !window.MovieIndex) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    input.value = initialQuery;

    function render(query) {
      var normalized = normalize(query);
      var movies = window.MovieIndex;
      var matches = normalized
        ? movies.filter(function (movie) {
            var haystack = normalize([
              movie.title,
              movie.region,
              movie.type,
              movie.year,
              movie.genre,
              movie.tags,
              movie.category
            ].join(' '));
            return haystack.indexOf(normalized) !== -1;
          })
        : movies.slice(0, 48);

      if (count) {
        count.textContent = normalized ? matches.length + ' Results' : 'Movie Library';
      }

      if (title) {
        title.textContent = normalized ? '搜索结果：' + query : '热门片库推荐';
      }

      if (!matches.length) {
        results.innerHTML = '<div class="empty-state">没有找到匹配影片，请尝试更换关键词。</div>';
        return;
      }

      results.innerHTML = matches.slice(0, 120).map(createSearchCard).join('');
    }

    input.addEventListener('input', function () {
      render(input.value);
    });

    render(initialQuery);
  }

  function initPlayers() {
    selectAll('[data-player]').forEach(function (shell) {
      var video = shell.querySelector('video');
      var button = shell.querySelector('.player-overlay');
      var source = shell.getAttribute('data-source');
      var hls = null;
      var ready = false;

      if (!video || !button || !source) {
        return;
      }

      function attachSource() {
        if (ready) {
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(source);
          hls.attachMedia(video);
        } else {
          video.src = source;
        }

        ready = true;
      }

      function playVideo() {
        attachSource();
        shell.classList.add('is-playing');

        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            shell.classList.remove('is-playing');
          });
        }
      }

      button.addEventListener('click', playVideo);
      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        if (!video.ended) {
          shell.classList.remove('is-playing');
        }
      });
      video.addEventListener('click', function () {
        if (video.paused) {
          playVideo();
        } else {
          video.pause();
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHero();
    initLocalFilter();
    initSearchPage();
    initPlayers();
  });
})();
