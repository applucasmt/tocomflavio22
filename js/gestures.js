/* =============================================================
   GESTURES — arrastar, pinça, zoom com roda e slider
   ============================================================= */
(function(window){
  'use strict';

  const Gestures = {
    _stage: null,
    _editor: null,
    _active: false,

    init(editor) {
      this._editor = editor;
      this._stage = document.getElementById('stage');
      if (!this._stage) return;

      this._bindTouch();
      this._bindMouse();
      this._bindWheel();
      this._bindSlider();
      this._bindDragDrop();
    },

    _allow() {
      return this._editor.hasImage() && !window.Camera?.isActive();
    },

    /* ============ TOUCH ============ */
    _bindTouch() {
      const stage = this._stage;
      let isDragging = false;
      let startX = 0, startY = 0;
      let lastPanX = 0, lastPanY = 0;
      let initialDist = 0, initialZoom = 1;
      let zoomCenterX = 0, zoomCenterY = 0;

      stage.addEventListener('touchstart', e => {
        if (!this._allow()) return;
        e.preventDefault();
        const t = e.touches;

        if (t.length === 1) {
          isDragging = true;
          startX = t[0].clientX;
          startY = t[0].clientY;
          lastPanX = this._editor.panX;
          lastPanY = this._editor.panY;
        } else if (t.length === 2) {
          isDragging = false;
          initialDist = Utils.touchDistance(t[0], t[1]);
          initialZoom = this._editor.zoom;
          const center = Utils.touchCenter(t[0], t[1]);
          const r = stage.getBoundingClientRect();
          zoomCenterX = (center.x - r.left) * (1080 / r.width) - 540;
          zoomCenterY = (center.y - r.top)  * (1080 / r.height) - 540;
        }
      }, { passive: false });

      stage.addEventListener('touchmove', e => {
        if (!this._allow()) return;
        e.preventDefault();
        const t = e.touches;
        const r = stage.getBoundingClientRect();
        const scaleX = 1080 / r.width;
        const scaleY = 1080 / r.height;

        if (t.length === 1 && isDragging) {
          this._editor.panX = lastPanX + (t[0].clientX - startX) * scaleX;
          this._editor.panY = lastPanY + (t[0].clientY - startY) * scaleY;
          this._editor.render();
        } else if (t.length === 2) {
          const dist = Utils.touchDistance(t[0], t[1]);
          const scale = dist / initialDist;
          const newZoom = Math.min(Math.max(initialZoom * scale, 0.5), 4);
          const d = newZoom - initialZoom;

          this._editor.panX -= d * zoomCenterX;
          this._editor.panY -= d * zoomCenterY;
          this._editor.zoom = newZoom;

          const zs = document.getElementById('zoomSlider');
          const zl = document.getElementById('zoomLabel');
          if (zs) zs.value = newZoom;
          if (zl) zl.textContent = Math.round(newZoom * 100) + '%';

          this._editor.render();
        }
      }, { passive: false });

      stage.addEventListener('touchend', () => { isDragging = false; }, { passive: true });
    },

    /* ============ MOUSE ============ */
    _bindMouse() {
      const stage = this._stage;
      let dragging = false;
      let startX = 0, startY = 0;
      let lastPanX = 0, lastPanY = 0;

      stage.addEventListener('mousedown', e => {
        if (!this._allow()) return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        lastPanX = this._editor.panX;
        lastPanY = this._editor.panY;
        stage.classList.add('dragging');
      });

      window.addEventListener('mousemove', e => {
        if (!dragging || !this._allow()) return;
        const r = stage.getBoundingClientRect();
        this._editor.panX = lastPanX + (e.clientX - startX) * (1080 / r.width);
        this._editor.panY = lastPanY + (e.clientY - startY) * (1080 / r.height);
        this._editor.render();
      });

      window.addEventListener('mouseup', () => {
        if (dragging) {
          dragging = false;
          stage.classList.remove('dragging');
        }
      });
    },

    /* ============ WHEEL ============ */
    _bindWheel() {
      this._stage.addEventListener('wheel', e => {
        if (!this._allow()) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        const newZoom = Math.min(Math.max(this._editor.zoom + delta, 0.5), 4);
        const r = this._stage.getBoundingClientRect();
        const cx = (e.clientX - r.left) * (1080 / r.width) - 540;
        const cy = (e.clientY - r.top)  * (1080 / r.height) - 540;
        const d = newZoom - this._editor.zoom;

        this._editor.panX -= d * cx;
        this._editor.panY -= d * cy;
        this._editor.setZoom(newZoom);
      }, { passive: false });
    },

    /* ============ SLIDER ============ */
    _bindSlider() {
      const slider = document.getElementById('zoomSlider');
      if (!slider) return;
      slider.addEventListener('input', e => {
        if (!this._editor.hasImage()) return;
        this._editor.setZoom(parseFloat(e.target.value));
      });
    },

    /* ============ DRAG & DROP ============ */
    _bindDragDrop() {
      const stage = this._stage;
      ['dragenter', 'dragover'].forEach(ev => {
        stage.addEventListener(ev, e => {
          e.preventDefault();
          stage.classList.add('drag-over');
        });
      });
      ['dragleave', 'drop'].forEach(ev => {
        stage.addEventListener(ev, e => {
          e.preventDefault();
          stage.classList.remove('drag-over');
        });
      });
      stage.addEventListener('drop', e => {
        const file = e.dataTransfer?.files?.[0];
        if (file && window.App) window.App.handleFile(file);
      });
    }
  };

  window.Gestures = Gestures;
})(window);
