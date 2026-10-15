/* =============================================================
   EDITOR — renderização do canvas (foto + moldura)
   ============================================================= */
(function(window){
  'use strict';

  const SIZE = 1080;

  const Editor = {
    canvas: null,
    ctx: null,

    // Estado
    image: null,
    imageLoaded: false,
    zoom: 1,
    panX: 0,
    panY: 0,

    // Refs de UI
    _ui: {},

    init() {
      this.canvas = document.getElementById('canvas');
      this.ctx = this.canvas.getContext('2d');
      this._ui = {
        placeholder: document.getElementById('placeholder'),
        hint: document.getElementById('hint'),
        zoomBar: document.getElementById('zoomBar'),
        zoomSlider: document.getElementById('zoomSlider'),
        zoomLabel: document.getElementById('zoomLabel'),
        resetBtn: document.getElementById('resetBtn'),
        aiBtn: document.getElementById('aiBtn'),
        downloadBtn: document.getElementById('downloadBtn')
      };

      this.render();
    },

    /** Define nova imagem (substitui a anterior e reseta zoom/pan) */
    setImage(img, { resetView = true, autoRender = true } = {}) {
      this.image = img;
      this.imageLoaded = true;
      if (resetView) this.resetView();
      if (autoRender) this.render();
    },

    clearImage() {
      this.image = null;
      this.imageLoaded = false;
      this.resetView();
      this.render();
    },

    resetView() {
      this.zoom = 1;
      this.panX = 0;
      this.panY = 0;
      const { zoomSlider, zoomLabel } = this._ui;
      if (zoomSlider) zoomSlider.value = 1;
      if (zoomLabel) zoomLabel.textContent = '100%';
    },

    setZoom(z) {
      this.zoom = Math.min(Math.max(z, 0.5), 4);
      const { zoomSlider, zoomLabel } = this._ui;
      if (zoomSlider) zoomSlider.value = this.zoom;
      if (zoomLabel) zoomLabel.textContent = Math.round(this.zoom * 100) + '%';
      this.render();
    },

    hasImage() { return this.imageLoaded && this.image; },

    /** Desenha tudo */
    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, SIZE, SIZE);

      // Fundo branco
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, SIZE, SIZE);

      if (this.imageLoaded && this.image) {
        this._drawPhoto(ctx);
        this._updateUI(true);
      } else {
        this._updateUI(false);
      }

      // Moldura por cima
      if (window.Frames) window.Frames.drawOn(ctx, SIZE);

      // Estado do botão salvar
      const { downloadBtn } = this._ui;
      if (downloadBtn) downloadBtn.disabled = !this.imageLoaded;
    },

    _drawPhoto(ctx) {
      const img = this.image;
      const aspect = img.width / img.height;
      let dw, dh;
      if (aspect > 1) { dh = SIZE; dw = SIZE * aspect; }
      else            { dw = SIZE; dh = SIZE / aspect; }

      const fw = dw * this.zoom;
      const fh = dh * this.zoom;
      const x = (SIZE - fw) / 2 + this.panX;
      const y = (SIZE - fh) / 2 + this.panY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, SIZE, SIZE);
      ctx.clip();
      ctx.drawImage(img, x, y, fw, fh);
      ctx.restore();
    },

    _updateUI(hasImage) {
      const { placeholder, hint, zoomBar, resetBtn, aiBtn } = this._ui;
      if (placeholder) placeholder.style.display = hasImage ? 'none' : 'flex';
      if (hint)        hint.classList.toggle('show', hasImage);
      if (zoomBar)     zoomBar.style.display = hasImage ? 'flex' : 'none';
      if (resetBtn)    resetBtn.style.display = hasImage ? 'flex' : 'none';
      if (aiBtn)       aiBtn.disabled = !hasImage;
    },

    /** Exporta o canvas como Blob PNG */
    toBlob() {
      return new Promise(resolve => {
        this.canvas.toBlob(b => resolve(b), 'image/png', 1.0);
      });
    },

    getCanvas() { return this.canvas; },
    getSize()   { return SIZE; }
  };

  window.Editor = Editor;
})(window);
