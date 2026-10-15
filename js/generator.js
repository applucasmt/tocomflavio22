/* =============================================================
   GENERATOR — IA de geração de imagem
   Usa Pollinations.ai (grátis, sem key)
   ============================================================= */
(function(window) {
  'use strict';

  const DEFAULT_PROMPT = 'Professional close-up portrait photograph of the person, maintaining strictly the same identity, face, expression and physical characteristics from the reference image, without any alteration. The person is facing right in a three-quarter profile view, with the same long dark brown hair with highlights, the same natural smile looking to the side, and wearing the same thin necklace with a small pendant from the reference. The person is in an outdoor setting, like a wooded park, with softly blurred background (bokeh effect) showing foliage, trees, and natural daylight. Framing is shoulder-up portrait, with soft natural lighting that highlights the details of their hair and smile. Ultra-realistic, 8k, professional photography.';

  const Generator = {
    isGenerating: false,
    prompt: DEFAULT_PROMPT,

    generate: function() {
      const self = this;
      if (this.isGenerating) return;

      const editor = window.Editor;
      if (!editor.hasImage()) {
        Toast.error('Carregue uma foto primeiro');
        return;
      }

      this.isGenerating = true;
      const btn = document.getElementById('generateBtn');
      const originalText = btn ? btn.innerHTML : '';

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Gerando...';
      }

      Toast.info('🎨 Gerando com IA... (30-60s)');

      const url = this._buildPollinationsUrl(this.prompt);

      this._preloadImage(url, 90000)
        .then(function(finalUrl) {
          const newImg = new Image();
          newImg.crossOrigin = 'anonymous';

          return new Promise(function(resolve, reject) {
            newImg.onload = function() { resolve(newImg); };
            newImg.onerror = function() { reject(new Error('Falha ao carregar resultado')); };
            newImg.src = finalUrl;
          });
        })
        .then(function(newImg) {
          editor.setImage(newImg, { resetView: true, autoRender: true });
          Toast.success('✨ Imagem gerada!');

          setTimeout(function() {
            if (window.AI && window.AI.removeBg) {
              window.AI.removeBg();
            }
          }, 600);
        })
        .catch(function(err) {
          console.error('[Generator] Erro:', err);
          Toast.error('Erro: ' + (err.message || 'Falha na geração'));
        })
        .then(function() {
          self.isGenerating = false;
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
        });
    },

    _buildPollinationsUrl: function(prompt) {
      const encoded = encodeURIComponent(prompt);
      const seed = Math.floor(Math.random() * 1000000);
      return 'https://image.pollinations.ai/prompt/' + encoded +
             '?width=1024&height=1024&seed=' + seed +
             '&model=flux&nologo=true&enhance=true';
    },

    _preloadImage: function(url, timeoutMs) {
      timeoutMs = timeoutMs || 60000;
      return new Promise(function(resolve, reject) {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        const timer = setTimeout(function() {
          reject(new Error('Timeout ao gerar imagem'));
        }, timeoutMs);

        img.onload = function() {
          clearTimeout(timer);
          if (img.naturalWidth < 10) {
            reject(new Error('Imagem inválida recebida'));
            return;
          }
          resolve(url);
        };
        img.onerror = function() {
          clearTimeout(timer);
          reject(new Error('Falha ao gerar imagem (servidor indisponível)'));
        };
        img.src = url;
      });
    },

    setPrompt: function(newPrompt) {
      this.prompt = newPrompt;
    }
  };

  window.Generator = Generator;
})(window);
