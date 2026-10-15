/* =============================================================
   FRAMES — gerenciamento das molduras
   ============================================================= */
(function(window){
  'use strict';

  const CANVAS_SIZE = 1080;

  /**
   * 👉 ADICIONE / REMOVA MOLDURAS AQUI
   * IMPORTANTE: o caminho é relativo ao index.html
   * Se seus PNGs estão na pasta /frames/, use 'frames/mold-01.png'
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
    _failed: new Set(),

    init(onChange) {
      this._onChange = onChange;
      const container = document.getElementById('frames');
      const countEl = document.getElementById('frameCount');
      if (!container) return;

      container.innerHTML = '';
      if (countEl) countEl.textContent = `${FRAMES_URLS.length} disponíveis`;

      for (let i = FRAMES_URLS.length - 1; i >= 0; i--) {
        const el = document.createElement('div');
        el.className = 'frame' + (i === this.currentIndex ? ' active' : '');
        el.dataset.index = i;
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `Moldura ${i + 1}`);

        const thumb = document.createElement('img');
        thumb.src = FRAMES_URLS[i];
        thumb.alt = `Moldura ${i + 1}`;
        thumb.loading = 'lazy';

        // ✅ FIX: se falhar, mostra placeholder visual em vez de quebrar
        thumb.onerror = () => {
          this._failed.add(i);
          el.style.opacity = '.35';
          el.style.background = 'linear-gradient(135deg, #2A303C, #1E232E)';
          thumb.style.display = 'none';
          const fallback = document.createElement('span');
          fallback.textContent = '?';
          fallback.style.cssText = 'font-size:24px;color:#8B93A1;font-weight:700';
          el.appendChild(fallback);
          console.warn(`[Frames] Não foi possível carregar: ${FRAMES_URLS[i]}`);
        };

        const num = document.createElement('span');
        num.className = 'num';
        num.textContent = i + 1;

        el.appendChild(thumb);
        el.appendChild(num);

        const select = () => {
          if (this._failed.has(i)) {
            window.Toast?.error('Esta moldura não foi encontrada no repositório');
            return;
          }
          document.querySelectorAll('.frame').forEach(f => f.classList.remove('active'));
          el.classList.add('active');
          this.currentIndex = i;
          this.load();
        };

        el.addEventListener('click', select);
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
        });

        container.appendChild(el);
      }

      // Se a moldura padrão falhou, tenta a próxima disponível
      if (this._failed.has(this.currentIndex)) {
        for (let i = FRAMES_URLS.length - 1; i >= 0; i--) {
          if (!this._failed.has(i)) {
            this.currentIndex = i;
            document.querySelectorAll('.frame').forEach((f, idx) => {
              f.classList.toggle('active', parseInt(f.dataset.index) === i);
            });
            break;
          }
        }
      }
    },

    load() {
      if (this._failed.has(this.currentIndex)) {
        this.loaded = false;
        if (this._onChange) this._onChange(null);
        return;
      }

      this.loaded = false;
      this.activeImage = new Image();
      this.activeImage.crossOrigin = 'anonymous';

      this.activeImage.onload = () => {
        this.loaded = true;
        const overlay = document.getElementById('cameraOverlay');
        if (overlay) overlay.src = this.activeImage.src;
        if (typeof this._onChange === 'function') this._onChange(this.activeImage);
      };

      this.activeImage.onerror = () => {
        this._failed.add(this.currentIndex);
        this.loaded = false;
        window.Toast?.error(`Moldura ${this.currentIndex + 1} não encontrada`);
        if (this._onChange) this._onChange(null);
      };

      // ✅ FIX: adiciona cache-bust apenas em dev (opcional)
      // Em produção (GitHub Pages) não é necessário
      this.activeImage.src = FRAMES_URLS[this.currentIndex];
    },

    drawOn(ctx, size = CANVAS_SIZE) {
      if (this.loaded && this.activeImage.complete && this.activeImage.naturalWidth > 0) {
        ctx.drawImage(this.activeImage, 0, 0, size, size);
      }
    },

    getImage() { return this.activeImage; },
    getSize()  { return CANVAS_SIZE; }
  };

  window.Frames = Frames;
})(window);
