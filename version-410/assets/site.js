(function () {
  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
      return;
    }
    document.addEventListener("DOMContentLoaded", callback);
  }

  function setupMenu() {
    const button = document.querySelector(".menu-toggle");
    const menu = document.querySelector(".mobile-nav");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function () {
      const open = menu.classList.toggle("open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    const root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }
    const slides = Array.from(root.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(root.querySelectorAll("[data-hero-dot]"));
    if (slides.length <= 1) {
      return;
    }
    let current = 0;
    let timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function restart(index) {
      if (timer) {
        window.clearInterval(timer);
      }
      show(index);
      start();
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        restart(index);
      });
    });

    start();
  }

  function setupFilters() {
    const grids = Array.from(document.querySelectorAll("[data-filter-grid]"));
    if (!grids.length) {
      return;
    }
    const input = document.querySelector("[data-filter-input]");
    const category = document.querySelector("[data-filter-category]");
    const year = document.querySelector("[data-filter-year]");

    function matchYear(card, selected) {
      if (!selected || selected === "all") {
        return true;
      }
      const value = Number(card.getAttribute("data-year") || "0");
      if (selected === "older") {
        return value < 2023;
      }
      return String(value) === selected;
    }

    function apply() {
      const query = input ? input.value.trim().toLowerCase() : "";
      const selectedCategory = category ? category.value : "all";
      const selectedYear = year ? year.value : "all";
      grids.forEach(function (grid) {
        const cards = Array.from(grid.querySelectorAll(".movie-card"));
        cards.forEach(function (card) {
          const text = (card.getAttribute("data-search") || "").toLowerCase();
          const cardCategory = card.getAttribute("data-category") || "";
          const visible = (!query || text.indexOf(query) !== -1) &&
            (selectedCategory === "all" || selectedCategory === cardCategory) &&
            matchYear(card, selectedYear);
          card.classList.toggle("is-filter-hidden", !visible);
        });
      });
    }

    [input, category, year].forEach(function (control) {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });
  }

  function setupPlayer() {
    const video = document.querySelector(".movie-player");
    const cover = document.querySelector(".player-cover");
    const playLink = document.querySelector("[data-play-link]");
    if (!video) {
      return;
    }
    const stream = video.getAttribute("data-stream") || "";
    let started = false;
    let hlsInstance = null;

    function begin() {
      if (!stream || started) {
        if (video.paused) {
          video.play().catch(function () {});
        }
        return;
      }
      started = true;
      video.controls = true;
      if (cover) {
        cover.classList.add("is-hidden");
        window.setTimeout(function () {
          cover.hidden = true;
        }, 260);
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
        video.play().catch(function () {});
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
        return;
      }
      video.src = stream;
      video.play().catch(function () {});
    }

    if (cover) {
      cover.addEventListener("click", begin);
    }
    video.addEventListener("click", function () {
      if (!started) {
        begin();
      }
    });
    if (playLink) {
      playLink.addEventListener("click", function (event) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        begin();
      });
    }
    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayer();
  });
})();
