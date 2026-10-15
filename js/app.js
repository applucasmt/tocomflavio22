/* =============================================================
   APP — orquestrador principal
   ============================================================= */
(function(window) {
  'use strict';

  const App = {
    init: function() {
      Editor.init();
      Frames.init(function() { Editor.render(); });
      Gestures.init(Editor);
      Toast.init();
      Utils.registerSW();

      this._bindButtons();

      if (window.AI && window.AI.initFaceDetector) {
        setTimeout(function() {
          window.AI.initFaceDetector().catch(function() {});
        }, 1000);
      }

      this._updateStatus('ready');
    },

    _bindButtons: function() {
      const fileInput = document.getElementById('fileInput');
      const cameraBtn = document.getElementById('cameraBtn');
      const aiBtn = document.getElementById('aiBtn');
      const generateBtn = document.getElementById('generateBtn');
      const downloadBtn = document.getElementById('downloadBtn');
      const resetBtn = document.getElementById('resetBtn');
      const refreshBtn = document.getElementById('refreshFramesBtn');

      if (fileInput) {
        fileInput.addEventListener('change', function() {
          if (this.files && this.files[0]) {
            if (Camera.isActive()) Camera.stop();
            App.handleFile(this.files[0]);
          }
        });
      }

      if (cameraBtn) {
        cameraBtn.addEventListener('click', function() {
          Camera.open();
        });
      }

      if (aiBtn) {
        aiBtn.addEventListener('click', function() {
          if (window.AI && window.AI.runFull) {
            window.AI.runFull();
          }
        });
      }

      if (generateBtn) {
        generateBtn.addEventListener('click', function() {
          if (!window.Generator) {
            Toast.error('Módulo de geração não carregado');
            return;
          }
          window.Generator.generate();
        });
      }

      if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
          Share.save();
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener('click', function() {
          if (Camera.isActive()) Camera.stop();
          Editor.clearImage();
          if (fileInput) fileInput.value = '';
          const genBtn = document.getElementById('generateBtn');
          if (genBtn) genBtn.disabled = true;
          Toast.info('Foto removida');
        });
      }

      // Botão de refresh das molduras
      if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
          refreshBtn.style.transition = 'transform 0.6s';
          refreshBtn.style.transform = 'rotate(360deg)';

          setTimeout(function() {
            refreshBtn.style.transform = '';
            refreshBtn.style.transition = '';
          }, 600);

          if (window.Toast) Toast.info('🔄 Buscando novas molduras...');

          Frames.refresh().then(function() {
            if (window.Toast) {
              Toast.success('✨ ' + Frames.urls.length + ' molduras encontradas!');
            }
          });
        });
      }

      if (aiBtn) {
        const observer = new MutationObserver(function() {
          const hasImage = Editor.hasImage();
          const genBtn = document.getElementById('generateBtn');
          if (genBtn) genBtn.disabled = !hasImage;
        });
        observer.observe(aiBtn, {
          attributes: true,
          attributeFilter: ['disabled']
        });
      }

      window.addEventListener('ai-ready', function() {
        App._updateStatus('ready');
      });
    },

    handleFile: function(file) {
      if (!file || !file.type.startsWith('image/')) {
        Toast.error('Selecione uma imagem válida');
        return;
      }

      const loader = document.getElementById('loader');
      const loaderText = document.getElementById('loaderText');
      if (loader) loader.classList.add('active');
      if (loaderText) loaderText.textContent = 'Carregando imagem...';

      const reader = new FileReader();

      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          Editor.setImage(img, { resetView: true });
          if (loader) loader.classList.remove('active');

          const genBtn = document.getElementById('generateBtn');
          if (genBtn) genBtn.disabled = false;

          Toast.success('Foto carregada!');
        };
        img.onerror = function() {
          if (loader) loader.classList.remove('active');
          Toast.error('Erro ao carregar imagem');
        };
        img.src = e.target.result;
      };

      reader.onerror = function() {
        if (loader) loader.classList.remove('active');
        Toast.error('Erro ao ler arquivo');
      };

      reader.readAsDataURL(file);
    },

    _updateStatus: function(state) {
      const pill = document.getElementById('statusPill');
      if (!pill) return;
      pill.classList.remove('loading', 'error');
      if (state === 'loading') pill.classList.add('loading');
      else if (state === 'error') pill.classList.add('error');
    }
  };

  window.App = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { App.init(); });
  } else {
    App.init();
  }
})(window);
