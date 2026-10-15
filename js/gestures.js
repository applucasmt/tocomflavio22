/* =============================================================
   GESTURES — arrastar, pinça, zoom com roda e slider
   ============================================================= */
(function(window) {
  'use strict';

  const Gestures = {
    _stage: null,
    _editor: null,

    init: function(editor) {
      this._editor = editor;
      this._stage = document.getElementById('stage');
      if (!this._stage) return;

      this._bindTouch();
      this._bindMouse();
      this._bindWheel();
      this._bindSlider();
      this._bindDragDrop();
    },

    _allow: function() {
      const cameraActive = window.Camera && window.Camera.isActive && window.Camera.isActive();
      return this._editor.hasImage() && !cameraActive;
    },

    _bindTouch: function() {
      const self = this;
      const stage = this._stage;
      let isDragging = false;
      let startX = 0, startY = 0;
      let lastPanX = 0, lastPanY = 0;
      let initialDist = 0, initialZoom = 1;
      let zoomCenterX = 0, zoomCenterY = 0;

      stage.addEventListener('touchstart', function(e) {
        if (!self._allow()) return;
        e.preventDefault();
        const t = e.touches;

        if (t.length === 1) {
          isDragging = true;
          startX = t[0].clientX;
          startY = t[0].clientY;
          lastPanX = self._editor.panX;
          lastPanY = self._editor.panY;
        } else if (t.length === 2) {
          isDragging = false;
          initialDist = Utils.touchDistance(t[0], t[1]);
          initialZoom = self._editor.zoom;
          const center = Utils.touchCenter(t[0], t[1]);
          const r = stage.getBoundingClientRect();
          zoomCenterX = (center.x - r.left) * (1080 / r.width) - 540;
          zoomCenterY = (center.y - r.top) * (1080 / r.height) - 540;
        }
      }, { passive: false });

      stage.addEventListener('touchmove', function(e) {
        if (!self._allow()) return;
        e.preventDefault();
        const t = e.touches;
        const r = stage.getBoundingClientRect();
        const scaleX = 1080 / r.width;
        const scaleY = 1080 / r.height;

        if (t.length === 1 && isDragging) {
          self._editor.panX = lastPanX + (t[0].clientX - startX) * scaleX;
          self._editor.panY = lastPanY + (t[0].clientY - startY) * scaleY;
          self._editor.render();
        } else if (t.length === 2) {
          const dist = Utils.touchDistance(t[0], t[1]);
          const scale = dist / initialDist;
          const newZoom = Math.min(Math.max(initialZoom * scale, 0.5), 4);
          const d = newZoom - initialZoom;

          self._editor.panX -= d * zoomCenterX;
          self._editor.panY -= d * zoomCenterY;
          self._editor.zoom = newZoom;

          const zs = document.getElementById('zoomSlider');
          const zl = document.getElementById('zoomLabel');
          if (zs) zs.value = newZoom;
          if (zl) zl.textContent = Math.round(newZoom * 100) + '%';

          self._editor.render();
        }
      }, { passive: false });

      stage.addEventListener('touchend', function() {
        isDragging = false;
      }, { passive: true });
    },

    _bindMouse: function() {
      const self = this;
      const stage = this._stage;
      let dragging = false;
      let startX = 0, startY = 0;
      let lastPanX = 0, lastPanY = 0;

      stage.addEventListener('mousedown', function(e) {
        if (!self._allow()) return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        lastPanX = self._editor.panX;
        lastPanY = self._editor.panY;
        stage.classList.add('dragging');
      });

      window.addEventListener('mousemove', function(e) {
        if (!dragging || !self._allow()) return;
        const r = stage.getBoundingClientRect();
        self._editor.panX = lastPanX + (e.clientX - startX) * (1080 / r.width);
        self._editor.panY = lastPanY + (e.clientY - startY) * (1080 / r.height);
        self._editor.render();
      });

      window.addEventListener('mouseup', function() {
        if (dragging) {
          dragging = false;
          stage.classList.remove('dragging');
        }
      });
    },

    _bindWheel: function() {
      const self = this;
      this._stage.addEventListener('wheel', function(e) {
        if (!self._allow()) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        const newZoom = Math.min(Math.max(self._editor.zoom + delta, 0.5), 4);
        const r = self._stage.getBoundingClientRect();
        const cx = (e.clientX - r.left) * (1080 / r.width) - 540;
        const cy = (e.clientY - r.top) * (1080 / r.height) - 540;
        const d = newZoom - self._editor.zoom;

        self._editor.panX -= d * cx;
        self._editor.panY -= d * cy;
        self._editor.setZoom(newZoom);
      }, { passive: false });
    },

    _bindSlider: function() {
      const self = this;
      const slider = document.getElementById('zoomSlider');
      if (!slider) return;
      slider.addEventListener('input', function(e) {
        if (!self._editor.hasImage()) return;
        self._editor.setZoom(parseFloat(e.target.value));
      });
    },

    _bindDragDrop: function() {
      const stage = this._stage;

      ['dragenter', 'dragover'].forEach(function(ev) {
        stage.addEventListener(ev, function(e) {
          e.preventDefault();
          stage.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(function(ev) {
        stage.addEventListener(ev, function(e) {
          e.preventDefault();
          stage.classList.remove('drag-over');
        });
      });

      stage.addEventListener('drop', function(e) {
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file && window.App) window.App.handleFile(file);
      });
    }
  };

  window.Gestures = Gestures;
})(window);
