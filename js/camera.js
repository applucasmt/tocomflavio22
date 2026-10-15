/* =============================================================
   CAMERA — captura ao vivo com preview da moldura
   ============================================================= */
(function(window) {
  'use strict';

  const Camera = {
    stream: null,
    active: false,
    _video: null,
    _overlay: null,
    _captureBtn: null,

    isActive: function() { return this.active; },

    open: function() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        Toast.error('Câmera não suportada neste navegador');
        return;
      }
      this.stop();

      const stage = document.getElementById('stage');
      const video = document.createElement('video');
      video.id = 'video';
      video.setAttribute('playsinline', '');
      video.setAttribute('autoplay', '');
      video.muted = true;

      const overlay = document.createElement('img');
      overlay.id = 'cameraOverlay';
      if (window.Frames && window.Frames.loaded) {
        overlay.src = window.Frames.getImage().src;
      }

      stage.appendChild(video);
      stage.appendChild(overlay);

      this._video = video;
      this._overlay = overlay;

      const self = this;

      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1080 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      .then(function(stream) {
        self.stream = stream;
        video.srcObject = stream;

        video.onloadedmetadata = function() {
          video.play().then(function() {
            self.active = true;

            const btn = document.createElement('button');
            btn.id = 'captureBtn';
            btn.className = 'btn btn-primary';
            btn.innerHTML = '📸 Capturar';
            btn.addEventListener('click', function() { self.capture(); });
            stage.appendChild(btn);
            self._captureBtn = btn;
          }).catch(function() {
            Toast.error('Erro ao iniciar vídeo');
            self.stop();
          });
        };
      })
      .catch(function() {
        Toast.error('Não foi possível acessar a câmera');
        self.stop();
      });
    },

    capture: function() {
      const video = this._video;
      if (!video || !video.videoWidth) return;

      const size = 1080;
      const tmp = document.createElement('canvas');
      tmp.width = size;
      tmp.height = size;
      const tctx = tmp.getContext('2d');

      const s = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - s) / 2;
      const sy = (video.videoHeight - s) / 2;
      tctx.drawImage(video, sx, sy, s, s, 0, 0, size, size);

      const self = this;
      const img = new Image();
      img.onload = function() {
        self.stop();
        if (window.Editor) {
          Editor.setImage(img, { resetView: true });
        }
        const genBtn = document.getElementById('generateBtn');
        if (genBtn) genBtn.disabled = false;
        Toast.success('Foto capturada!');
      };
      img.src = tmp.toDataURL('image/png');
    },

    stop: function() {
      if (this.stream) {
        this.stream.getTracks().forEach(function(t) { t.stop(); });
        this.stream = null;
      }
      if (this._video && this._video.parentNode) this._video.parentNode.removeChild(this._video);
      if (this._overlay && this._overlay.parentNode) this._overlay.parentNode.removeChild(this._overlay);
      if (this._captureBtn && this._captureBtn.parentNode) this._captureBtn.parentNode.removeChild(this._captureBtn);
      this._video = null;
      this._overlay = null;
      this._captureBtn = null;
      this.active = false;
    }
  };

  window.Camera = Camera;
})(window);
