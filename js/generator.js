/* =============================================================
   GENERATOR — Geração com IA preservando identidade
   
   MODO ATUAL: Desativado (Pollinations gera rosto aleatório)
   → O botão fica oculto até você configurar uma API que
     preserve a identidade da pessoa.
   
   COMO ATIVAR:
   1. Crie conta em https://replicate.com
   2. Pegue seu token em https://replicate.com/account/api-tokens
   3. Cole o token em REPLICATE_TOKEN abaixo
   4. Descomente as linhas marcadas com [ATIVAR]
   ============================================================= */
(function(window) {
  'use strict';

  // ============================================================
  // CONFIGURAÇÃO
  // ============================================================
  const REPLICATE_TOKEN = ''; // ← Cole seu token aqui para ativar
  const USE_REPLICATE = REPLICATE_TOKEN.length > 0;

  const PROMPT = 'A professional close-up portrait photograph, maintaining rigorously the same identity, face, expression and physical characteristics of the person in the reference image, without any alteration. Three-quarter profile view facing right, same hair, same natural smile, same features. Outdoor setting with softly blurred background (bokeh), natural warm lighting, ultra-realistic, 8k professional photography.';

  const Generator = {
    isGenerating: false,
    prompt: PROMPT,

    /**
     * Gera imagem preservando identidade
     * Só funciona se REPLICATE_TOKEN estiver configurado
     */
    async generate() {
      if (this.isGenerating) return;

      const editor = window.Editor;
      if (!editor.hasImage()) {
        Toast.error('Carregue uma foto primeiro');
        return;
      }

      if (!USE_REPLICATE) {
        Toast.error('IA de geração não configurada. Veja o README.');
        console.warn('[Generator] Configure REPLICATE_TOKEN em js/generator.js');
        return;
      }

      this.isGenerating = true;
      const btn = document.getElementById('generateBtn');
      const originalText = btn ? btn.innerHTML : '';

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Gerando com IA...';
      }

      try {
        Toast.info('🎨 Gerando com IA... (30-60s)');

        // 1. Converte imagem atual para dataURL
        const img = editor.image;
        const off = document.createElement('canvas');
        const MAX = 768;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        off.width = Math.round(img.width * scale);
        off.height = Math.round(img.height * scale);
        off.getContext('2d').drawImage(img, 0, 0, off.width, off.height);
        const dataUrl = off.toDataURL('image/jpeg', 0.9);

        // 2. Chama Replicate
        const resultUrl = await this._callReplicate(dataUrl, this.prompt);

        // 3. Carrega resultado
        const newImg = await this._loadImage(resultUrl);

        // 4. Aplica no editor
        editor.setImage(newImg, { resetView: true, autoRender: true });
        Toast.success('✨ Imagem gerada com IA!');

        // 5. Auto-enquadra rosto
        setTimeout(() => {
          if (window.AI?.autoFrameFace) window.AI.autoFrameFace();
        }, 500);

      } catch (err) {
        console.error('[Generator] Erro:', err);
        Toast.error('Erro: ' + (err.message || 'Falha na geração'));
      } finally {
        this.isGenerating = false;
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      }
    },

    /**
     * Replicate — IP-Adapter FaceID
     * Docs: https://replicate.com/lucataco/ip-adapter-faceid
     *
     * Fluxo:
     * 1. Faz upload da imagem como data URL
     * 2. Chama a API com o prompt + imagem de referência
     * 3. Aguarda o resultado (polling)
     * 4. Retorna a URL da imagem gerada
     */
    async _callReplicate(dataUrl, prompt) {
      const REPLICATE_API = 'https://api.replicate.com/v1/predictions';
      const MODEL_VERSION = 'c0e3d4c2a5c... '; // ← Substitua pela versão exata do modelo escolhido

      // Opção A: usar modelo pronto (mais simples)
      // https://replicate.com/lucataco/ip-adapter-faceid
      const response = await fetch(REPLICATE_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Use a versão EXATA do modelo que você quer
          // (pegue em https://replicate.com/lucataco/ip-adapter-faceid/api)
          version: 'YOUR_MODEL_VERSION_HERE',
          input: {
            prompt: prompt,
            image: dataUrl,           // foto de referência
            negative_prompt: 'different person, changed face, different hair, wrong identity',
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 30
          }
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error('Replicate: ' + err);
      }

      let prediction = await response.json();

      // Polling até terminar
      while (prediction.status === 'starting' || prediction.status === 'processing') {
        await new Promise(r => setTimeout(r, 1500));
        const poll = await fetch(`${REPLICATE_API}/${prediction.id}`, {
          headers: { 'Authorization': `Bearer ${REPLICATE_TOKEN}` }
        });
        prediction = await poll.json();
      }

      if (prediction.status === 'failed') {
        throw new Error(prediction.error || 'Falha na geração');
      }

      return prediction.output[0]; // URL da imagem
    },

    _loadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Falha ao carregar resultado'));
        img.src = url;
      });
    },

    setPrompt(newPrompt) {
      this.prompt = newPrompt;
    }
  };

  window.Generator = Generator;
})(window);
