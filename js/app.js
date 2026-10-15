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

      // 3. Verifica se o botão "Gerar IA" está configurado
      this._checkGeneratorConfig();

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
          // Chama direto — o próprio Generator avisa se não configurado
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
          // Habilita sempre que tiver imagem
          generateBtn.disabled = !hasImage;
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
       VERIFICA SE O GENERATOR ESTÁ CONFIGURADO
       (só para log no console — o botão fica sempre visível)
       ========================================================= */
    _checkGeneratorConfig: function() {
      const generateBtn = document.getElementById('generateBtn');
      if (!generateBtn) {
        console.warn('[App] ⚠️ Botão "Gerar IA" não encontrado no DOM');
        return;
      }

      if (!window.Generator) {
        console.warn('[App] ⚠️ Módulo Generator não carregado');
        return;
      }

      if (typeof window.Generator.isEnabled === 'function') {
        if (window.Generator.isEnabled()) {
          generateBtn.dataset.notConfigured = '';
          generateBtn.title = 'Gerar versão profissional com IA';
          console.info('[App] ✅ IA de geração configurada e pronta!');
        } else {
          generateBtn.dataset.notConfigured = 'true';
          generateBtn.title = 'IA não configurada — clique para saber mais';
          console.info(
            '[App] ℹ️ Botão "Gerar IA" está visível mas não configurado.\n' +
            'Para ativar:\n' +
            '  1. Crie conta em https://replicate.com\n' +
            '  2. Pegue token em https://replicate.com/account/api-tokens\n' +
            '  3. Cole em REPLICATE_TOKEN em js/generator.js\n' +
            '  4. Pegue MODEL_VERSION em https://replicate.com/lucataco/ip-adapter-faceid'
          );
        }
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

          // Habilita botão "Gerar IA"
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
