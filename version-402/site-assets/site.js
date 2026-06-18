(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function setupMobileMenu() {
    var button = document.querySelector("[data-menu-button]");
    var nav = document.querySelector("[data-mobile-nav]");

    if (!button || !nav) {
      return;
    }

    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var activeIndex = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === activeIndex);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === activeIndex);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        showSlide(activeIndex + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        showSlide(Number(dot.getAttribute("data-hero-dot")) || 0);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        showSlide(activeIndex - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        showSlide(activeIndex + 1);
        restart();
      });
    }

    restart();
  }

  function setupFilters() {
    var panel = document.querySelector("[data-filter-panel]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    var result = document.querySelector("[data-filter-result]");

    if (!panel || !cards.length) {
      return;
    }

    var keyword = panel.querySelector("[data-filter-keyword]");
    var region = panel.querySelector("[data-filter-region]");
    var year = panel.querySelector("[data-filter-year]");
    var genre = panel.querySelector("[data-filter-genre]");
    var reset = panel.querySelector("[data-filter-reset]");
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q");

    if (initialQuery && keyword) {
      keyword.value = initialQuery;
    }

    function cardMatches(card) {
      var query = normalize(keyword && keyword.value);
      var regionValue = normalize(region && region.value);
      var yearValue = normalize(year && year.value);
      var genreValue = normalize(genre && genre.value);
      var haystack = normalize([
        card.getAttribute("data-title"),
        card.getAttribute("data-region"),
        card.getAttribute("data-genre"),
        card.getAttribute("data-year"),
        card.getAttribute("data-category"),
        card.getAttribute("data-tags"),
        card.textContent
      ].join(" "));

      if (query && haystack.indexOf(query) === -1) {
        return false;
      }

      if (regionValue && normalize(card.getAttribute("data-region")).indexOf(regionValue) === -1) {
        return false;
      }

      if (yearValue && normalize(card.getAttribute("data-year")).indexOf(yearValue) === -1) {
        return false;
      }

      if (genreValue && normalize(card.getAttribute("data-genre")).indexOf(genreValue) === -1) {
        return false;
      }

      return true;
    }

    function applyFilters() {
      var visible = 0;

      cards.forEach(function (card) {
        var matched = cardMatches(card);
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });

      if (result) {
        result.textContent = "当前显示 " + visible + " / " + cards.length + " 部影片";
      }
    }

    [keyword, region, year, genre].forEach(function (control) {
      if (control) {
        control.addEventListener("input", applyFilters);
        control.addEventListener("change", applyFilters);
      }
    });

    if (reset) {
      reset.addEventListener("click", function () {
        if (keyword) {
          keyword.value = "";
        }
        if (region) {
          region.value = "";
        }
        if (year) {
          year.value = "";
        }
        if (genre) {
          genre.value = "";
        }
        applyFilters();
      });
    }

    applyFilters();
  }

  function attachHls(video, sources, onReady, onError) {
    var sourceIndex = 0;
    var hls = null;

    function destroyHls() {
      if (hls) {
        hls.destroy();
        hls = null;
      }
    }

    function trySource() {
      var source = sources[sourceIndex];

      if (!source) {
        onError("播放源暂时无法加载");
        return;
      }

      destroyHls();

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        onReady();
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          onReady();
        });
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            sourceIndex += 1;
            trySource();
          }
        });
        return;
      }

      video.src = source;
      onReady();
    }

    video.addEventListener("error", function () {
      sourceIndex += 1;
      trySource();
    });

    trySource();
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));

    players.forEach(function (player) {
      var video = player.querySelector("video");
      var button = player.querySelector("[data-play-button]");
      var message = player.querySelector("[data-player-message]");
      var rawSources = player.getAttribute("data-video-src") || "";
      var sources = rawSources.split(",").map(function (source) {
        return source.trim();
      }).filter(Boolean);
      var initialized = false;

      if (!video || !button || !sources.length) {
        return;
      }

      function setMessage(text) {
        if (message) {
          message.textContent = text;
        }
      }

      function startPlayback() {
        player.classList.add("is-loading");
        setMessage("正在加载播放源…");

        function playVideo() {
          initialized = true;
          player.classList.remove("is-loading");
          player.classList.add("is-playing");
          setMessage("正在播放");
          var playPromise = video.play();

          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {
              player.classList.remove("is-playing");
              setMessage("浏览器阻止自动播放，请再次点击播放");
            });
          }
        }

        if (initialized) {
          playVideo();
          return;
        }

        attachHls(video, sources, playVideo, function (errorText) {
          player.classList.remove("is-loading");
          setMessage(errorText);
        });
      }

      button.addEventListener("click", startPlayback);
      video.addEventListener("play", function () {
        player.classList.add("is-playing");
      });
      video.addEventListener("pause", function () {
        player.classList.remove("is-playing");
      });
    });
  }

  ready(function () {
    setupMobileMenu();
    setupHero();
    setupFilters();
    setupPlayers();
  });
})();
