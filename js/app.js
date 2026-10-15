/* =============================================================
   APP — orquestrador principal
   ============================================================= */
(function(window){
  'use strict';

  const App = {
    init() {
      // 1. Inicializa módulos
      Editor.init();
      Frames.init(() => Editor.render());
      Frames.load();
      Gestures.init(Editor);
      Toast.init();

      // 2. Registra Service Worker (PWA)
      Utils.registerSW();

      // 3. Bind dos botões
      this._bindButtons();

      // 4. Pré-carrega detector facial
      if (window.AI?.initFaceDetector) window.AI.initFaceDetector();

      // 5. Status pill
      this._updateStatus('ready');
    },

    _bindButtons() {
      const fileInput = document.getElementById('fileInput');
      const cameraBtn = document.getElementById('cameraBtn');
      const aiBtn = document.getElementById('aiBtn');
      const downloadBtn = document.getElementById('downloadBtn');
      const resetBtn = document.getElementById('resetBtn');

      fileInput?.addEventListener('change', function() {
        if (this.files?.[0]) {
          if (Camera.isActive()) Camera.stop();
          App.handleFile(this.files[0]);
        }
      });

      cameraBtn?.addEventListener('click', () => Camera.open());
      aiBtn?.addEventListener('click', () => window.AI?.runFull());
      downloadBtn?.addEventListener('click', () => Share.save());

      resetBtn?.addEventListener('click', () => {
        if (Camera.isActive()) Camera.stop();
        Editor.clearImage();
        if (fileInput) fileInput.value = '';
        Toast.info('Foto removida');
      });

      // Evento global para saber quando IA está pronta
      window.addEventListener('ai-ready', () => this._updateStatus('ready'));
    },

    /** Processa arquivo vindo do input ou drag&drop */
    handleFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        Toast.error('Selecione uma imagem válida');
        return;
      }

      const loader = document.getElementById('loader');
      const loaderText = document.getElementById('loaderText');
      if (loader) loader.classList.add('active');
      if (loaderText) loaderText.textContent = 'Carregando imagem...';

      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          Editor.setImage(img, { resetView: true });
          loader?.classList.remove('active');
          Toast.success('Foto carregada!');
        };
        img.onerror = () => {
          loader?.classList.remove('active');
          Toast.error('Erro ao carregar imagem');
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        loader?.classList.remove('active');
        Toast.error('Erro ao ler arquivo');
      };
      reader.readAsDataURL(file);
    },

    _updateStatus(state) {
      const pill = document.getElementById('statusPill');
      if (!pill) return;
      pill.classList.remove('loading', 'error');
      if (state === 'loading') pill.classList.add('loading');
      else if (state === 'error') pill.classList.add('error');
    }
  };

  window.App = App;

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})(window);
