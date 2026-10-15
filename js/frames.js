/* =============================================================
   FRAMES — gerenciamento das molduras
   ============================================================= */
(function(window){
  'use strict';

  const CANVAS_SIZE = 1080;

  /**
   * 👉 ADICIONE / REMOVA MOLDURAS AQUI
   * A última da lista será a padrão ao carregar o app.
   * Coloque os PNGs na pasta /frames/
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

    /** Inicializa o seletor de molduras no DOM */
    init(onChange) {
      this._onChange = onChange;
      const container = document.getElementById('frames');
      const countEl = document.getElementById('frameCount');
      if (!container) return;

      container.innerHTML = '';
      if (countEl) countEl.textContent = `${FRAMES_URLS.length} disponíveis`;

      // Renderiza do mais recente para o mais antigo
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
        thumb.onerror = () => { el.style.opacity = '.3'; };

        const num = document.createElement('span');
        num.className = 'num';
        num.textContent = i + 1;

        el.appendChild(thumb);
        el.appendChild(num);

        const select = () => {
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
    },

    /** Carrega a moldura atual */
    load() {
      this.loaded = false;
      this.activeImage = new Image();
      this.activeImage.crossOrigin = 'anonymous';
      this.activeImage.onload = () => {
        this.loaded = true;

        // Atualiza overlay da câmera se estiver ativo
        const overlay = document.getElementById('cameraOverlay');
        if (overlay) overlay.src = this.activeImage.src;

        if (typeof this._onChange === 'function') this._onChange(this.activeImage);
      };
      this.activeImage.onerror = () => {
        if (window.Toast) Toast.error('Erro ao carregar moldura');
      };
      this.activeImage.src = FRAMES_URLS[this.currentIndex];
    },

    /** Desenha a moldura sobre o canvas */
    drawOn(ctx, size = CANVAS_SIZE) {
      if (this.loaded && this.activeImage.complete) {
        ctx.drawImage(this.activeImage, 0, 0, size, size);
      }
    },

    /** Retorna a imagem ativa */
    getImage() { return this.activeImage; },
    getSize()  { return CANVAS_SIZE; }
  };

  window.Frames = Frames;
})(window);
