(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
      return;
    }
    document.addEventListener('DOMContentLoaded', callback);
  }

  function getBase() {
    return document.body.dataset.base || './';
  }

  function initMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      panel.classList.toggle('open');
    });
  }

  function initSearchForms() {
    var forms = document.querySelectorAll('[data-search-form]');
    forms.forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('input[name="q"]');
        var query = input ? input.value.trim() : '';
        var target = getBase() + 'all-movies.html';
        if (query) {
          target += '?q=' + encodeURIComponent(query);
        }
        window.location.href = target;
      });
    });
  }

  function initHero() {
    var carousel = document.querySelector('[data-hero-carousel]');
    if (!carousel) {
      return;
    }
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
    var prev = carousel.querySelector('[data-hero-prev]');
    var next = carousel.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, pos) {
        slide.classList.toggle('active', pos === current);
      });
      dots.forEach(function (dot, pos) {
        dot.classList.toggle('active', pos === current);
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
        timer = null;
      }
    }

    dots.forEach(function (dot, pos) {
      dot.addEventListener('click', function () {
        show(pos);
        start();
      });
    });
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
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initFilters() {
    var panel = document.querySelector('[data-filter-panel]');
    var grid = document.querySelector('[data-filter-grid]');
    if (!panel || !grid) {
      return;
    }
    var keywordInput = panel.querySelector('[data-filter-keyword]');
    var categorySelect = panel.querySelector('[data-filter-category]');
    var yearSelect = panel.querySelector('[data-filter-year]');
    var regionSelect = panel.querySelector('[data-filter-region]');
    var typeSelect = panel.querySelector('[data-filter-type]');
    var resetButton = panel.querySelector('[data-filter-reset]');
    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-movie-card]'));
    var resultCount = document.querySelector('[data-result-count]');
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    if (keywordInput && initialQuery) {
      keywordInput.value = initialQuery;
    }

    function normalize(value) {
      return String(value || '').toLowerCase().trim();
    }

    function applyFilters() {
      var keyword = normalize(keywordInput && keywordInput.value);
      var category = categorySelect ? categorySelect.value : '';
      var year = yearSelect ? yearSelect.value : '';
      var region = regionSelect ? regionSelect.value : '';
      var type = typeSelect ? typeSelect.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var match = true;
        if (keyword && normalize(card.dataset.search).indexOf(keyword) === -1) {
          match = false;
        }
        if (category && card.dataset.category !== category) {
          match = false;
        }
        if (year && card.dataset.year !== year) {
          match = false;
        }
        if (region && card.dataset.region !== region) {
          match = false;
        }
        if (type && card.dataset.type !== type) {
          match = false;
        }
        card.classList.toggle('hidden-by-filter', !match);
        if (match) {
          visible += 1;
        }
      });

      if (resultCount) {
        resultCount.textContent = '共 ' + visible + ' 部影片';
      }
    }

    [keywordInput, categorySelect, yearSelect, regionSelect, typeSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilters);
        control.addEventListener('change', applyFilters);
      }
    });

    if (resetButton) {
      resetButton.addEventListener('click', function () {
        if (keywordInput) keywordInput.value = '';
        if (categorySelect) categorySelect.value = '';
        if (yearSelect) yearSelect.value = '';
        if (regionSelect) regionSelect.value = '';
        if (typeSelect) typeSelect.value = '';
        applyFilters();
      });
    }
    applyFilters();
  }

  function destroyHls(video) {
    if (video._hlsInstance) {
      video._hlsInstance.destroy();
      video._hlsInstance = null;
    }
  }

  function playSource(player, source) {
    var video = player.querySelector('video');
    var overlay = player.querySelector('[data-player-start]');
    if (!video || !source) {
      return;
    }
    destroyHls(video);
    if (overlay) {
      overlay.classList.add('hidden');
    }

    if (/\.m3u8(\?|$)/i.test(source) && window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      video._hlsInstance = hls;
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, function (_, data) {
        if (!data || !data.fatal) {
          return;
        }
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
        }
      });
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        video.play().catch(function () {});
      });
      return;
    }

    if (/\.m3u8(\?|$)/i.test(source) && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.play().catch(function () {});
      return;
    }

    video.src = source;
    video.play().catch(function () {});
  }

  function initPlayers() {
    var players = document.querySelectorAll('[data-player]');
    players.forEach(function (player) {
      var start = player.querySelector('[data-player-start]');
      var buttons = Array.prototype.slice.call(player.querySelectorAll('[data-video-source]'));
      var selected = player.dataset.video || (buttons[0] && buttons[0].dataset.videoSource);

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          selected = button.dataset.videoSource;
          buttons.forEach(function (item) {
            item.classList.toggle('active', item === button);
          });
          playSource(player, selected);
        });
      });

      if (start) {
        start.addEventListener('click', function () {
          playSource(player, selected);
        });
      }
    });
  }

  ready(function () {
    initMenu();
    initSearchForms();
    initHero();
    initFilters();
    initPlayers();
  });
})();
