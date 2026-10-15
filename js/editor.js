/* =============================================================
   EDITOR — renderização do canvas
   Ordem: Fundo → Moldura (atrás) → Foto (na frente)
   ============================================================= */
(function(window) {
  'use strict';

  const SIZE = 1080;

  const Editor = {
    canvas: null,
    ctx: null,
    image: null,
    imageLoaded: false,
    zoom: 1,
    panX: 0,
    panY: 0,
    _ui: {},

    init: function() {
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

    setImage: function(img, opts) {
      opts = opts || {};
      const resetView = opts.resetView !== false;
      const autoRender = opts.autoRender !== false;

      this.image = img;
      this.imageLoaded = true;
      if (resetView) this.resetView();
      if (autoRender) this.render();
    },

    clearImage: function() {
      this.image = null;
      this.imageLoaded = false;
      this.resetView();
      this.render();
    },

    resetView: function() {
      this.zoom = 1;
      this.panX = 0;
      this.panY = 0;
      if (this._ui.zoomSlider) this._ui.zoomSlider.value = 1;
      if (this._ui.zoomLabel) this._ui.zoomLabel.textContent = '100%';
    },

    setZoom: function(z) {
      this.zoom = Math.min(Math.max(z, 0.5), 4);
      if (this._ui.zoomSlider) this._ui.zoomSlider.value = this.zoom;
      if (this._ui.zoomLabel) this._ui.zoomLabel.textContent = Math.round(this.zoom * 100) + '%';
      this.render();
    },

    hasImage: function() {
      return this.imageLoaded && !!this.image;
    },

    /* =========================================================
       RENDER — ORDEM CORRIGIDA
       =========================================================
       1. Fundo branco
       2. Moldura (fica ATRÁS)
       3. Foto do usuário (fica NA FRENTE, aparece no centro transparente)
       ========================================================= */
    render: function() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, SIZE, SIZE);

      // 1. Fundo branco (visível nas áreas transparentes da moldura)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, SIZE, SIZE);

      // 2. Moldura PRIMEIRO (fica atrás da foto)
      if (window.Frames) window.Frames.drawOn(ctx, SIZE);

      // 3. Foto do usuário POR ÚLTIMO (aparece por cima / no centro transparente)
      if (this.imageLoaded && this.image) {
        this._drawPhoto(ctx);
        this._updateUI(true);
      } else {
        this._updateUI(false);
      }

      // Estado do botão salvar
      if (this._ui.downloadBtn) {
        this._ui.downloadBtn.disabled = !this.imageLoaded;
      }
    },

    _drawPhoto: function(ctx) {
      const img = this.image;
      const aspect = img.width / img.height;
      let dw, dh;

      if (aspect > 1) {
        dh = SIZE;
        dw = SIZE * aspect;
      } else {
        dw = SIZE;
        dh = SIZE / aspect;
      }

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

    _updateUI: function(hasImage) {
      const ui = this._ui;
      if (ui.placeholder) ui.placeholder.style.display = hasImage ? 'none' : 'flex';
      if (ui.hint) ui.hint.classList.toggle('show', hasImage);
      if (ui.zoomBar) ui.zoomBar.style.display = hasImage ? 'flex' : 'none';
      if (ui.resetBtn) ui.resetBtn.style.display = hasImage ? 'flex' : 'none';
      if (ui.aiBtn) ui.aiBtn.disabled = !hasImage;
    },

    toBlob: function() {
      const self = this;
      return new Promise(function(resolve) {
        self.canvas.toBlob(function(b) { resolve(b); }, 'image/png', 1.0);
      });
    },

    getCanvas: function() { return this.canvas; },
    getSize: function() { return SIZE; }
  };

  window.Editor = Editor;
})(window);
