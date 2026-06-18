document.addEventListener("DOMContentLoaded", function () {
    initMobileMenu();
    initHero();
    initLibraryFilters();
    initPlayers();
});

function initMobileMenu() {
    var button = document.querySelector(".menu-button");
    var nav = document.querySelector(".mobile-nav");

    if (!button || !nav) {
        return;
    }

    button.addEventListener("click", function () {
        var opened = nav.classList.toggle("is-open");
        button.setAttribute("aria-expanded", opened ? "true" : "false");
    });
}

function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));

    if (!slides.length || !dots.length) {
        return;
    }

    var current = 0;
    var timer = null;

    function show(index) {
        current = index % slides.length;
        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle("is-active", slideIndex === current);
        });
        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle("is-active", dotIndex === current);
        });
    }

    function start() {
        timer = window.setInterval(function () {
            show(current + 1);
        }, 5200);
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
            if (timer) {
                window.clearInterval(timer);
            }
            show(index);
            start();
        });
    });

    start();
}

function initLibraryFilters() {
    var lists = Array.prototype.slice.call(document.querySelectorAll(".library-list"));

    if (!lists.length) {
        return;
    }

    var input = document.querySelector(".library-search");
    var filters = Array.prototype.slice.call(document.querySelectorAll(".library-filter"));

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function apply() {
        var keyword = normalize(input ? input.value : "");
        var activeFilters = filters.map(function (filter) {
            return {
                key: filter.getAttribute("data-filter"),
                value: normalize(filter.value)
            };
        });

        lists.forEach(function (list) {
            var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));
            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute("data-title"),
                    card.getAttribute("data-tags"),
                    card.getAttribute("data-type"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-region")
                ].join(" "));
                var matchedKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                var matchedFilters = activeFilters.every(function (item) {
                    if (!item.value) {
                        return true;
                    }
                    return normalize(card.getAttribute("data-" + item.key)) === item.value;
                });
                card.classList.toggle("is-hidden", !(matchedKeyword && matchedFilters));
            });
        });
    }

    if (input) {
        input.addEventListener("input", apply);
    }

    filters.forEach(function (filter) {
        filter.addEventListener("change", apply);
    });
}

function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll(".player-shell"));

    players.forEach(function (shell) {
        var video = shell.querySelector("video");
        var button = shell.querySelector(".play-overlay");

        if (!video) {
            return;
        }

        var source = video.querySelector("source");
        var url = source ? source.getAttribute("src") : video.currentSrc;
        var hlsInstance = null;
        var ready = false;

        function prepare() {
            if (ready || !url) {
                return;
            }

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = url;
            } else if (window.Hls && window.Hls.isSupported()) {
                if (source) {
                    source.removeAttribute("src");
                }
                hlsInstance = new window.Hls({
                    capLevelToPlayerSize: true,
                    maxBufferLength: 30
                });
                hlsInstance.loadSource(url);
                hlsInstance.attachMedia(video);
            } else {
                video.src = url;
            }

            ready = true;
        }

        function play() {
            prepare();
            shell.classList.add("is-playing");
            var promise = video.play();

            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {
                    shell.classList.remove("is-playing");
                });
            }
        }

        if (button) {
            button.addEventListener("click", play);
        }

        video.addEventListener("play", function () {
            shell.classList.add("is-playing");
        });

        video.addEventListener("pause", function () {
            if (video.currentTime === 0 || video.ended) {
                shell.classList.remove("is-playing");
            }
        });

        video.addEventListener("click", function () {
            if (video.paused) {
                play();
            }
        });

        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
}
