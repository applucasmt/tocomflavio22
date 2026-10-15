/* =============================================================
   APP — orquestrador principal
   ============================================================= */
(function(window){
  'use strict';

  const App = {
    init() {
      Editor.init();
      Frames.init(() => Editor.render());
      Frames.load();
      Gestures.init(Editor);
      Toast.init();
      Utils.registerSW();

      this._bindButtons();

      if (window.AI?.initFaceDetector) {
        setTimeout(() => window.AI.initFaceDetector().catch(() => {}), 1000);
      }

      this._updateStatus('ready');
    },

    _bindButtons() {
      const fileInput = document.getElementById('fileInput');
      const cameraBtn = document.getElementById('cameraBtn');
      const aiBtn = document.getElementById('aiBtn');
      const generateBtn = document.getElementById('generateBtn');
      const downloadBtn = document.getElementById('downloadBtn');
      const resetBtn = document.getElementById('resetBtn');

      fileInput?.addEventListener('change', function() {
        if (this.files?.[0]) {
          if (Camera.isActive()) Camera.stop();
          App.handleFile(this.files[0]);
        }
      });

      cameraBtn?.addEventListener('click', () => Camera.open());

      // Recortar fundo (rápido)
      aiBtn?.addEventListener('click', () => window.AI?.runFull());

      // Gerar com IA (transformação completa)
      generateBtn?.addEventListener('click', () => {
        if (!window.Generator) {
          Toast.error('Módulo de geração não carregado');
          return;
        }
        window.Generator.generate();
      });

      downloadBtn?.addEventListener('click', () => Share.save());

      resetBtn?.addEventListener('click', () => {
        if (Camera.isActive()) Camera.stop();
        Editor.clearImage();
        if (fileInput) fileInput.value = '';
        Toast.info('Foto removida');
      });

      // Habilita botão Gerar quando há imagem
      const observer = new MutationObserver(() => {
        const hasImage = Editor.hasImage();
        if (generateBtn) generateBtn.disabled = !hasImage;
      });
      observer.observe(document.getElementById('aiBtn'), {
        attributes: true, attributeFilter: ['disabled']
      });

      window.addEventListener('ai-ready', () => this._updateStatus('ready'));
    },

    handleFile(file) {
      if (!file || !file.type.startsWith('image/'))
