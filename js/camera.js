/* =============================================================
   CAMERA — captura ao vivo com preview da moldura
   ============================================================= */
(function(window){
  'use strict';

  const Camera = {
    stream: null,
    active: false,
    _video: null,
    _overlay: null,
    _captureBtn: null,

    isActive() { return this.active; },

    /** Abre a câmera frontal */
    async open() {
      if (!navigator.mediaDevices?.getUserMedia) {
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
      if (window.Frames?.loaded) overlay.src = window.Frames.getImage().src;

      stage.appendChild(video);
      stage.appendChild(overlay);

      this._video = video;
      this._overlay = overlay;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1080 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        this.stream = stream;
        video.srcObject = stream;

        await new Promise(res => {
          video.onloadedmetadata = () => { video.play().then(res).catch(res); };
        });

        this.active = true;

        // Botão capturar
        const btn = document.createElement('button');
        btn.id = 'captureBtn';
        btn.className = 'btn btn-primary';
        btn.innerHTML = '📸 Capturar';
        btn.addEventListener('click', () => this.capture());
        stage.appendChild(btn);
        this._captureBtn = btn;

      } catch (err) {
        Toast.error('Não foi possível acessar a câmera');
        this.stop();
      }
    },

    /** Captura frame atual */
    capture() {
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

      const img = new Image();
      img.onload = () => {
        this.stop();
        if (window.Editor) {
          Editor.setImage(img, { resetView: true });
        }
        Toast.success('Foto capturada!');
      };
      img.src = tmp.toDataURL('image/png');
    },

    /** Fecha câmera e libera recursos */
    stop() {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }
      this._video?.remove();
      this._overlay?.remove();
      this._captureBtn?.remove();
      this._video = null;
      this._overlay = null;
      this._captureBtn = null;
      this.active = false;
    }
  };

  window.Camera = Camera;
})(window);
