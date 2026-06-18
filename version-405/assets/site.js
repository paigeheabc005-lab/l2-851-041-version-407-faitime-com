(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');

    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            var open = mobilePanel.classList.toggle('is-open');
            menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var current = 0;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                var index = Number(dot.getAttribute('data-hero-dot')) || 0;
                showSlide(index);
            });
        });

        if (slides.length > 1) {
            setInterval(function () {
                showSlide(current + 1);
            }, 5200);
        }
    }

    document.querySelectorAll('[data-player]').forEach(function (shell) {
        var video = shell.querySelector('video');
        var button = shell.querySelector('[data-play-button]');
        var source = video ? video.getAttribute('data-src') : '';
        var loaded = false;
        var hlsInstance = null;

        function loadVideo() {
            if (!video || loaded || !source) {
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
            } else {
                video.src = source;
            }

            loaded = true;
        }

        function playVideo() {
            loadVideo();
            if (!video) {
                return;
            }
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {});
            }
        }

        if (button) {
            button.addEventListener('click', playVideo);
        }

        if (video) {
            video.addEventListener('play', function () {
                shell.classList.add('is-playing');
            });
            video.addEventListener('pause', function () {
                shell.classList.remove('is-playing');
            });
            video.addEventListener('click', function () {
                loadVideo();
            });
        }

        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });

    var searchInput = document.querySelector('[data-search-input]');
    var searchResults = document.querySelector('[data-search-results]');
    var searchStatus = document.querySelector('[data-search-status]');

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderSearch(query) {
        if (!searchResults || !window.MOVIES) {
            return;
        }

        var keyword = String(query || '').trim().toLowerCase();
        if (searchInput) {
            searchInput.value = query || '';
        }

        if (!keyword) {
            searchResults.innerHTML = '';
            if (searchStatus) {
                searchStatus.textContent = '输入关键词后查看结果';
            }
            return;
        }

        var terms = keyword.split(/\s+/).filter(Boolean);
        var results = window.MOVIES.filter(function (movie) {
            var haystack = [
                movie.title,
                movie.year,
                movie.region,
                movie.category,
                movie.type,
                (movie.genres || []).join(' '),
                (movie.tags || []).join(' '),
                movie.oneLine
            ].join(' ').toLowerCase();
            return terms.every(function (term) {
                return haystack.indexOf(term) !== -1;
            });
        }).slice(0, 120);

        if (searchStatus) {
            searchStatus.textContent = results.length ? '相关结果' : '暂无匹配结果';
        }

        searchResults.innerHTML = results.map(function (movie) {
            var tags = (movie.tags || []).slice(0, 4).map(function (tag) {
                return '<span>' + escapeHtml(tag) + '</span>';
            }).join('');
            return '' +
                '<article class="movie-card">' +
                    '<a class="movie-cover" href="' + escapeHtml(movie.url) + '">' +
                        '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
                        '<span class="play-badge">播放</span>' +
                    '</a>' +
                    '<div class="movie-info">' +
                        '<a class="movie-title" href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a>' +
                        '<p class="movie-meta">' + escapeHtml([movie.year, movie.region, movie.type].filter(Boolean).join(' · ')) + '</p>' +
                        '<p class="movie-line">' + escapeHtml(movie.oneLine || '') + '</p>' +
                        '<div class="tag-row">' + tags + '</div>' +
                    '</div>' +
                '</article>';
        }).join('');
    }

    if (searchResults) {
        var params = new URLSearchParams(window.location.search);
        renderSearch(params.get('q') || '');

        if (searchInput) {
            searchInput.addEventListener('input', function () {
                renderSearch(searchInput.value);
            });
        }
    }
})();
