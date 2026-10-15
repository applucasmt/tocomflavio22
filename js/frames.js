/* =============================================================
   FRAMES — AUTO-DETECÇÃO de molduras
   Testa mold-01.png, mold-02.png... até não encontrar mais
   Guarda o resultado em localStorage para performance
   ============================================================= */
(function(window) {
  'use strict';

  const CANVAS_SIZE = 1080;
  const MAX_FRAMES = 100;
  const STORAGE_KEY = 'molduras_detected_v2';
  const CACHE_TTL = 1000 * 60 * 60; // 1 hora

  /**
   * Padrão dos nomes dos arquivos.
   * Mude aqui se seus arquivos têm outro formato.
   */
  const FILE_PATTERN = function(i) {
    const n = String(i).padStart(2, '0');
    return 'frames/mold-' + n + '.png';
  };

  const Frames = {
    urls: [],
    currentIndex: 0,
    activeImage: new Image(),
    loaded: false,
    _onChange: null,
    _failed: {},
    _detecting: false,

    async init(onChange) {
      this._onChange = onChange;

      // 1. Cache primeiro (instantâneo)
      const cached = this._getFromCache();
      if (cached && cached.length > 0) {
        console.log('[Frames] Cache:', cached.length, 'molduras');
        this.urls = cached;
        this._setupUI(cached);
        this.load();
        return;
      }

      // 2. Detecta do zero
      console.log('[Frames] Detectando molduras...');
      await this._detectFrames();
      this._setupUI(this.urls);
      this.load();
    },

    async _detectFrames() {
      if (this._detecting) return;
      this._detecting = true;

      const found = [];
      const self = this;

      for (let start = 1; start <= MAX_FRAMES; start += 5) {
        const batch = [];
        for (let i = start; i < start + 5 && i <= MAX_FRAMES; i++) {
          batch.push(self._checkExists(FILE_PATTERN(i)).then(function(exists) {
            return exists ? i : null;
          }));
        }

        const results = await Promise.all(batch);
        let allFailed = true;

        results.forEach(function(idx) {
          if (idx !== null) {
            found.push(idx);
            allFailed = false;
          }
        });

        if (allFailed) break;
      }

      found.sort(function(a, b) { return a - b; });
      this.urls = found.map(function(i) { return FILE_PATTERN(i); });

      if (this.urls.length === 0) {
        console.warn('[Frames] Nenhuma moldura detectada');
      } else {
        console.log('[Frames] Detectadas:', this.urls.length, 'molduras');
      }

      this._saveToCache(this.urls);
      this._detecting = false;
    },

    _checkExists(url) {
      return new Promise(function(resolve) {
        const img = new Image();
        let resolved = false;

        const timer = setTimeout(function() {
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        }, 3000);

        img.onload = function() {
          if (resolved) return;
          resolved = true;
          clearTimeout(timer);
          resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
        };

        img.onerror = function() {
          if (resolved) return;
          resolved = true;
          clearTimeout(timer);
          resolve(false);
        };

        img.src = url;
      });
    },

    _getFromCache() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (Date.now() - data.timestamp > CACHE_TTL) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
        return data.urls;
      } catch (e) {
        return null;
      }
    },

    _saveToCache(urls) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          urls: urls,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('[Frames] Cache falhou');
      }
    },

    async refresh() {
      localStorage.removeItem(STORAGE_KEY);
      this.urls = [];
      this.currentIndex = 0;
      this._failed = {};
      await this.init(this._onChange);
    },

    _setupUI(urls) {
      const container = document.getElementById('frames');
      const countEl = document.getElementById('frameCount');
      if (!container) return;

      container.innerHTML = '';
      if (countEl) countEl.textContent = urls.length + (urls.length === 1 ? ' disponível' : ' disponíveis');

      if (urls.length === 0) {
        container.innerHTML = '<div style="padding:20px;color:var(--text-sub);font-size:12px;text-align:center;width:100%">Nenhuma moldura encontrada</div>';
        return;
      }

      this.currentIndex = urls.length - 1;
      const self = this;

      for (let i = urls.length - 1; i >= 0; i--) {
        (function(index) {
          const el = document.createElement('div');
          el.className = 'frame' + (index === self.currentIndex ? ' active' : '');
          el.dataset.index = index;
          el.setAttribute('role', 'button');
          el.setAttribute('tabindex', '0');
          el.setAttribute('aria-label', 'Moldura ' + (index + 1));

          const thumb = document.createElement('img');
          thumb.src = urls[index];
          thumb.alt = 'Moldura ' + (index + 1);
          thumb.loading = 'lazy';

          thumb.onerror = function() {
            self._failed[index] = true;
            el.style.opacity = '.35';
            thumb.style.display = 'none';
            const fallback = document.createElement('span');
            fallback.textContent = '?';
            fallback.style.cssText = 'font-size:24px;color:#8B93A1;font-weight:700';
            el.appendChild(fallback);
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
    },

    load() {
      const self = this;

      if (!this.urls[this.currentIndex]) {
        this.loaded = false;
        if (this._onChange) this._onChange(null);
        return;
      }

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
        if (window.Toast) Toast.error('Moldura não encontrada');
        if (self._onChange) self._onChange(null);
      };

      this.activeImage.src = this.urls[this.currentIndex];
    },

    drawOn(ctx, size) {
      size = size || CANVAS_SIZE;
      if (this.loaded && this.activeImage.complete && this.activeImage.naturalWidth > 0) {
        ctx.drawImage(this.activeImage, 0, 0, size, size);
      }
    },

    getImage() { return this.activeImage; },
    getSize() { return CANVAS_SIZE; }
  };

  window.Frames = Frames;
})(window);
