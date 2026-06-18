(() => {
  const menuButton = document.querySelector('[data-menu-button]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', () => {
      mobilePanel.classList.toggle('open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    let current = 0;
    let timer = null;

    const showSlide = (index) => {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === current);
      });

      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === current);
      });
    };

    const start = () => {
      stop();
      timer = window.setInterval(() => {
        showSlide(current + 1);
      }, 5200);
    };

    const stop = () => {
      if (timer) {
        window.clearInterval(timer);
      }
    };

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showSlide(index);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    showSlide(0);
    start();
  }

  const filterPanel = document.querySelector('[data-filter-panel]');
  const cardList = document.querySelector('[data-card-list]');

  if (filterPanel && cardList) {
    const keywordInput = filterPanel.querySelector('[data-filter-keyword]');
    const yearSelect = filterPanel.querySelector('[data-filter-year]');
    const genreSelect = filterPanel.querySelector('[data-filter-genre]');
    const cards = Array.from(cardList.querySelectorAll('.movie-card'));
    const params = new URLSearchParams(window.location.search);
    const initialKeyword = params.get('q') || '';

    if (keywordInput && initialKeyword) {
      keywordInput.value = initialKeyword;
    }

    const normalize = (value) => (value || '').toString().trim().toLowerCase();

    const applyFilter = () => {
      const keyword = normalize(keywordInput ? keywordInput.value : '');
      const year = normalize(yearSelect ? yearSelect.value : '');
      const genre = normalize(genreSelect ? genreSelect.value : '');

      cards.forEach((card) => {
        const haystack = normalize([
          card.dataset.title,
          card.dataset.year,
          card.dataset.genre,
          card.dataset.region,
          card.dataset.type,
          card.textContent
        ].join(' '));
        const matchesKeyword = !keyword || haystack.includes(keyword);
        const matchesYear = !year || normalize(card.dataset.year).includes(year);
        const matchesGenre = !genre || normalize(card.dataset.genre).includes(genre) || haystack.includes(genre);

        card.classList.toggle('card-hidden', !(matchesKeyword && matchesYear && matchesGenre));
      });
    };

    [keywordInput, yearSelect, genreSelect].forEach((control) => {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });

    applyFilter();
  }

  document.querySelectorAll('.player-wrap').forEach((wrap) => {
    const video = wrap.querySelector('video');
    const overlay = wrap.querySelector('.player-overlay');
    const status = wrap.querySelector('.player-status');
    const source = wrap.dataset.video;
    let hlsInstance = null;

    if (!video || !source) {
      return;
    }

    const setStatus = (text) => {
      if (status) {
        status.textContent = text;
      }
    };

    const ensureLoaded = () => {
      if (video.dataset.ready === 'true') {
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, (event, data) => {
          if (data && data.fatal) {
            setStatus('播放加载遇到问题，请稍后重试');
          }
        });
      } else {
        video.src = source;
      }

      video.dataset.ready = 'true';
    };

    const play = async () => {
      ensureLoaded();

      try {
        await video.play();
        if (overlay) {
          overlay.classList.add('is-hidden');
        }
        setStatus('');
      } catch (error) {
        setStatus('点击画面继续播放');
      }
    };

    if (overlay) {
      overlay.addEventListener('click', play);
    }

    video.addEventListener('play', () => {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      setStatus('');
    });

    video.addEventListener('pause', () => {
      if (overlay && !video.ended) {
        overlay.classList.remove('is-hidden');
      }
    });

    video.addEventListener('click', () => {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    });

    window.addEventListener('beforeunload', () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });
})();
