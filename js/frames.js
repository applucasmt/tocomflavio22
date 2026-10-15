/* =============================================================
   FRAMES — gerenciamento das molduras
   ============================================================= */
(function(window) {
  'use strict';

  const CANVAS_SIZE = 1080;

  /**
   * 👉 ADICIONE / REMOVA MOLDURAS AQUI
   * O caminho é relativo ao index.html
   * Se seus PNGs estão em /frames/, use 'frames/mold-01.png'
   * Se estão na raiz, use 'mold-01.png'
   */
  const FRAMES_URLS = [
    'frames/mold-01.png',
    'frames/mold-02.png',
    'frames/mold-03.png',
    'frames/mold-04.png',
    'frames/mold-05.png',
    'frames/mold-06.png',
    'frames/mold-07.png',
    'frames/mold-08.png'
  ];

  const Frames = {
    urls: FRAMES_URLS,
    currentIndex: FRAMES_URLS.length - 1,
    activeImage: new Image(),
    loaded: false,
    _onChange: null,
    _failed: {},

    init: function(onChange) {
      this._onChange = onChange;
      const container = document.getElementById('frames');
      const countEl = document.getElementById('frameCount');
      if (!container) return;

      container.innerHTML = '';
      if (countEl) countEl.textContent = FRAMES_URLS.length + ' disponíveis';

      const self = this;

      for (let i = FRAMES_URLS.length - 1; i >= 0; i--) {
        (function(index) {
          const el = document.createElement('div');
          el.className = 'frame' + (index === self.currentIndex ? ' active' : '');
          el.dataset.index = index;
          el.setAttribute('role', 'button');
          el.setAttribute('tabindex', '0');
          el.setAttribute('aria-label', 'Moldura ' + (index + 1));

          const thumb = document.createElement('img');
          thumb.src = FRAMES_URLS[index];
          thumb.alt = 'Moldura ' + (index + 1);
          thumb.loading = 'lazy';

          thumb.onerror = function() {
            self._failed[index] = true;
            el.style.opacity = '.35';
            el.style.background = 'linear-gradient(135deg, #2A303C, #1E232E)';
            thumb.style.display = 'none';
            const fallback = document.createElement('span');
            fallback.textContent = '?';
            fallback.style.cssText = 'font-size:24px;color:#8B93A1;font-weight:700';
            el.appendChild(fallback);
            console.warn('[Frames] Não foi possível carregar: ' + FRAMES_URLS[index]);
          };

          const num = document.createElement('span');
          num.className = 'num';
          num.textContent = index + 1;

          el.appendChild(thumb);
          el.appendChild(num);

          const select = function() {
            if (self._failed[index]) {
              if (window.Toast) Toast.error('Esta moldura não foi encontrada');
              return;
            }
            const all = document.querySelectorAll('.frame');
            for (let j = 0; j < all.length; j++) all[j].classList.remove('active');
            el.classList.add('active');
            self.currentIndex = index;
            self.load();
          };

          el.addEventListener('click', select);
          el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              select();
            }
          });

          container.appendChild(el);
        })(i);
      }

      // Se a padrão falhou, escolhe a próxima disponível
      if (this._failed[this.currentIndex]) {
        for (let i = FRAMES_URLS.length - 1; i >= 0; i--) {
          if (!this._failed[i]) {
            this.currentIndex = i;
            const all = document.querySelectorAll('.frame');
            for (let j = 0; j < all.length; j++) {
              all[j].classList.toggle('active', parseInt(all[j].dataset.index, 10) === i);
            }
            break;
          }
        }
      }
    },

    load: function() {
      const self = this;

      if (this._failed[this.currentIndex]) {
        this.loaded = false;
        if (this._onChange) this._onChange(null);
        return;
      }

      this.loaded = false;
      this.activeImage = new Image();
      this.activeImage.crossOrigin = 'anonymous';

      this.activeImage.onload = function() {
        self.loaded = true;
        const overlay = document.getElementById('cameraOverlay');
        if (overlay) overlay.src = self.activeImage.src;
        if (typeof self._onChange === 'function') self._onChange(self.activeImage);
      };

      this.activeImage.onerror = function() {
        self._failed[self.currentIndex] = true;
        self.loaded = false;
        if (window.Toast) Toast.error('Moldura ' + (self.currentIndex + 1) + ' não encontrada');
        if (self._onChange) self._onChange(null);
      };

      this.activeImage.src = FRAMES_URLS[this.currentIndex];
    },

    drawOn: function(ctx, size) {
      size = size || CANVAS_SIZE;
      if (this.loaded && this.activeImage.complete && this.activeImage.naturalWidth > 0) {
        ctx.drawImage(this.activeImage, 0, 0, size, size);
      }
    },

    getImage: function() { return this.activeImage; },
    getSize: function() { return CANVAS_SIZE; }
  };

  window.Frames = Frames;
})(window);
