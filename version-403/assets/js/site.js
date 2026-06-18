
(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  ready(function () {
    initMobileMenu();
    initHero();
    initFilters();
    initPlayers();
  });

  function initMobileMenu() {
    var button = document.querySelector('.mobile-toggle');
    var panel = document.querySelector('.mobile-panel');
    if (!button || !panel) {
      return;
    }

    button.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.textContent = open ? '×' : '☰';
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function schedule() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        schedule();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        schedule();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        schedule();
      });
    }

    show(0);
    schedule();
  }

  function initFilters() {
    var areas = Array.prototype.slice.call(document.querySelectorAll('.filter-area'));
    areas.forEach(function (area) {
      var search = area.querySelector('.filter-search');
      var category = area.querySelector('.filter-category');
      var year = area.querySelector('.filter-year');
      var cards = Array.prototype.slice.call(area.querySelectorAll('.movie-card'));
      var params = new URLSearchParams(window.location.search);
      var q = params.get('q');

      if (q && search) {
        search.value = q;
      }

      function normalize(value) {
        return (value || '').toString().toLowerCase().trim();
      }

      function apply() {
        var keyword = normalize(search && search.value);
        var cat = category ? category.value : '';
        var yr = year ? year.value : '';
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize([
            card.dataset.title,
            card.dataset.tags,
            card.dataset.year,
            card.dataset.category
          ].join(' '));
          var okKeyword = !keyword || haystack.indexOf(keyword) !== -1;
          var okCategory = !cat || card.dataset.category === cat;
          var okYear = !yr || card.dataset.year === yr;
          var show = okKeyword && okCategory && okYear;
          card.classList.toggle('hidden-by-filter', !show);
          if (show) {
            visible += 1;
          }
        });

        area.classList.toggle('is-empty', visible === 0);
      }

      if (search) {
        search.addEventListener('input', apply);
      }
      if (category) {
        category.addEventListener('change', apply);
      }
      if (year) {
        year.addEventListener('change', apply);
      }
      apply();
    });
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var triggers = Array.prototype.slice.call(player.querySelectorAll('.play-trigger'));
      if (!video) {
        return;
      }

      var source = video.getAttribute('data-src');
      var loaded = false;
      var hlsInstance = null;

      function load() {
        if (!source || loaded) {
          return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          loaded = true;
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          loaded = true;
          return;
        }

        video.src = source;
        loaded = true;
      }

      function play() {
        load();
        player.classList.add('is-playing');
        video.controls = true;
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            player.classList.remove('is-playing');
          });
        }
      }

      triggers.forEach(function (trigger) {
        trigger.addEventListener('click', function (event) {
          event.preventDefault();
          play();
        });
      });

      video.addEventListener('click', function () {
        if (!loaded) {
          play();
        }
      });

      video.addEventListener('play', function () {
        player.classList.add('is-playing');
      });

      video.addEventListener('pause', function () {
        if (video.currentTime === 0 || video.ended) {
          player.classList.remove('is-playing');
        }
      });

      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }
}());
