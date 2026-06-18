(() => {
    const navToggle = document.querySelector('.nav-toggle');
    const siteNav = document.querySelector('.site-nav');

    if (navToggle && siteNav) {
        navToggle.addEventListener('click', () => {
            const isOpen = siteNav.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    const slides = Array.from(document.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(document.querySelectorAll('[data-hero-dot]'));
    let activeSlide = 0;
    let slideTimer = null;

    const showSlide = (index) => {
        if (!slides.length) {
            return;
        }

        activeSlide = (index + slides.length) % slides.length;

        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('is-active', slideIndex === activeSlide);
        });

        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('is-active', dotIndex === activeSlide);
        });
    };

    const startSlides = () => {
        if (slides.length < 2) {
            return;
        }

        slideTimer = window.setInterval(() => {
            showSlide(activeSlide + 1);
        }, 5200);
    };

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            window.clearInterval(slideTimer);
            showSlide(index);
            startSlides();
        });
    });

    startSlides();

    const searchForms = document.querySelectorAll('[data-search-form]');

    searchForms.forEach((form) => {
        const input = form.querySelector('[data-search-input]');
        const filter = form.querySelector('[data-category-filter]');
        const list = document.querySelector('[data-card-list]');

        if (!input || !list) {
            return;
        }

        const cards = Array.from(list.children);

        const runFilter = () => {
            const term = input.value.trim().toLowerCase();
            const category = filter ? filter.value : '';

            cards.forEach((card) => {
                const keywords = (card.getAttribute('data-keywords') || '').toLowerCase();
                const cardCategory = card.getAttribute('data-category') || '';
                const matchText = !term || keywords.includes(term);
                const matchCategory = !category || cardCategory === category;
                card.classList.toggle('is-hidden', !(matchText && matchCategory));
            });
        };

        input.addEventListener('input', runFilter);

        if (filter) {
            filter.addEventListener('change', runFilter);
        }
    });

    const initPlayer = (box) => {
        if (box.dataset.ready === '1') {
            return Promise.resolve();
        }

        const video = box.querySelector('video');
        const url = box.getAttribute('data-m3u8');

        if (!video || !url) {
            return Promise.resolve();
        }

        box.dataset.ready = '1';

        if (window.Hls && window.Hls.isSupported()) {
            return new Promise((resolve) => {
                const hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });

                box._hls = hls;
                hls.loadSource(url);
                hls.attachMedia(video);

                if (window.Hls.Events && window.Hls.Events.MANIFEST_PARSED) {
                    hls.on(window.Hls.Events.MANIFEST_PARSED, resolve);
                }

                video.addEventListener('loadedmetadata', resolve, { once: true });
                window.setTimeout(resolve, 1200);
            });
        }

        if (video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('application/x-mpegURL')) {
            video.src = url;
        }

        return Promise.resolve();
    };

    document.querySelectorAll('.player-box').forEach((box) => {
        const video = box.querySelector('video');
        const button = box.querySelector('.player-start');

        if (!video || !button) {
            return;
        }

        const play = () => {
            initPlayer(box).then(() => {
                const attempt = video.play();

                if (attempt && typeof attempt.catch === 'function') {
                    attempt.catch(() => {});
                }
            });
        };

        button.addEventListener('click', play);
        video.addEventListener('click', () => {
            if (video.paused) {
                play();
            }
        });
        video.addEventListener('play', () => box.classList.add('is-playing'));
        video.addEventListener('pause', () => box.classList.remove('is-playing'));
        video.addEventListener('ended', () => box.classList.remove('is-playing'));
    });
})();
