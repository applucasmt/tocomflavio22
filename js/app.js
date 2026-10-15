/* =============================================================
   APP — orquestrador principal
   ============================================================= */
(function(window) {
  'use strict';

  const App = {
    init: function() {
      // 1. Inicializa módulos
      Editor.init();
      Frames.init(function() { Editor.render(); });
      Gestures.init(Editor);
      Toast.init();
      Utils.registerSW();

      // 2. Bind dos botões
      this._bindButtons();

      // 3. Esconde o botão "Gerar IA" se não estiver configurado
      this._hideGeneratorIfDisabled();

      // 4. Pré-carrega detector facial
      if (window.AI && window.AI.initFaceDetector) {
        setTimeout(function() {
          window.AI.initFaceDetector().catch(function() {});
        }, 1000);
      }

      // 5. Status inicial
      this._updateStatus('ready');
    },

    /* =========================================================
       BIND DE BOTÕES
       ========================================================= */
    _bindButtons: function() {
      const self = this;

      const fileInput   = document.getElementById('fileInput');
      const cameraBtn   = document.getElementById('cameraBtn');
      const aiBtn       = document.getElementById('aiBtn');
      const generateBtn = document.getElementById('generateBtn');
      const downloadBtn = document.getElementById('downloadBtn');
      const resetBtn    = document.getElementById('resetBtn');
      const refreshBtn  = document.getElementById('refreshFramesBtn');

      /* ---------- Galeria ---------- */
      if (fileInput) {
        fileInput.addEventListener('change', function() {
          if (this.files && this.files[0]) {
            if (Camera.isActive()) Camera.stop();
            App.handleFile(this.files[0]);
          }
        });
      }

      /* ---------- Câmera ---------- */
      if (cameraBtn) {
        cameraBtn.addEventListener('click', function() {
          Camera.open();
        });
      }

      /* ---------- Recortar fundo ---------- */
      if (aiBtn) {
        aiBtn.addEventListener('click', function() {
          if (window.AI && window.AI.runFull) {
            window.AI.runFull();
          } else {
            Toast.error('Módulo de IA não carregado');
          }
        });
      }

      /* ---------- Gerar versão IA ---------- */
      if (generateBtn) {
        generateBtn.addEventListener('click', function() {
          if (!window.Generator) {
            Toast.error('Módulo de geração não carregado');
            return;
          }
          // Verifica se está configurado
          if (window.Generator.isEnabled && !window.Generator.isEnabled()) {
            Toast.info('🔧 IA de geração não configurada. Veja o README.');
            console.warn(
              '[App] Para ativar a geração IA, configure REPLICATE_TOKEN em js/generator.js'
            );
            return;
          }
          window.Generator.generate();
        });
      }

      /* ---------- Salvar / Compartilhar ---------- */
      if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
          Share.save();
        });
      }

      /* ---------- Remover foto ---------- */
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

      /* ---------- Refresh das molduras ---------- */
      if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
          // Animação de rotação
          refreshBtn.style.transition = 'transform 0.6s';
          refreshBtn.style.transform = 'rotate(360deg)';

          setTimeout(function() {
            refreshBtn.style.transform = '';
            refreshBtn.style.transition = '';
          }, 600);

          if (window.Toast) Toast.info('🔄 Buscando novas molduras...');

          Frames.refresh().then(function() {
            if (window.Toast) {
              const total = Frames.urls.length;
              const msg = total === 0
                ? '⚠️ Nenhuma moldura encontrada'
                : '✨ ' + total + (total === 1 ? ' moldura encontrada!' : ' molduras encontradas!');
              Toast.success(msg);
            }
          });
        });
      }

      /* ---------- Observer: habilita "Gerar IA" quando há imagem ---------- */
      if (aiBtn && generateBtn) {
        const observer = new MutationObserver(function() {
          const hasImage = Editor.hasImage();
          // Só habilita se tiver imagem E IA configurada
          const isConfigured = !window.Generator?.isEnabled || window.Generator.isEnabled();
          generateBtn.disabled = !hasImage || !isConfigured;
        });
        observer.observe(aiBtn, {
          attributes: true,
          attributeFilter: ['disabled']
        });
      }

      /* ---------- Eventos globais ---------- */
      window.addEventListener('ai-ready', function() {
        App._updateStatus('ready');
      });
    },

    /* =========================================================
       ESCONDE BOTÃO "GERAR IA" SE NÃO ESTIVER CONFIGURADO
       ========================================================= */
    _hideGeneratorIfDisabled: function() {
      const generateBtn = document.getElementById('generateBtn');
      if (!generateBtn) return;

      // Se o Generator existe e tem o método isEnabled
      if (window.Generator && typeof window.Generator.isEnabled === 'function') {
        if (!window.Generator.isEnabled()) {
          // Marca como "não configurado" — CSS esconde, mas ainda dá para
          // clicar e ver a mensagem explicativa
          generateBtn.dataset.notConfigured = 'true';
          generateBtn.title = 'IA de geração não configurada — veja o README';
          console.warn(
            '[App] Botão "Gerar IA" marcado como não configurado. ' +
            'Configure REPLICATE_TOKEN em js/generator.js para ativar.'
          );
        }
      } else {
        // Generator não carregou — esconde o botão completamente
        generateBtn.style.display = 'none';
        console.warn('[App] Módulo Generator não encontrado — botão oculto.');
      }
    },

    /* =========================================================
       PROCESSA ARQUIVO (upload ou drag&drop)
       ========================================================= */
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

          // Habilita botão "Gerar IA" se estiver configurado
          const genBtn = document.getElementById('generateBtn');
          if (genBtn) {
            const isConfigured = !window.Generator?.isEnabled || window.Generator.isEnabled();
            genBtn.disabled = !isConfigured;
          }

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

    /* =========================================================
       ATUALIZA STATUS PILL
       ========================================================= */
    _updateStatus: function(state) {
      const pill = document.getElementById('statusPill');
      if (!pill) return;

      pill.classList.remove('loading', 'error');

      if (state === 'loading') pill.classList.add('loading');
      else if (state === 'error') pill.classList.add('error');
    }
  };

  window.App = App;

  /* =========================================================
     BOOT
     ========================================================= */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { App.init(); });
  } else {
    App.init();
  }
})(window);
