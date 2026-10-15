/* =============================================================
   SHARE — salvar / compartilhar imagem
   ============================================================= */
(function(window){
  'use strict';

  const Share = {
    async save() {
      const editor = window.Editor;
      const btn = document.getElementById('downloadBtn');
      if (!editor.hasImage() || !btn) return;

      const original = btn.innerHTML;
      btn.innerHTML = '⏳ Processando...';
      btn.disabled = true;

      try {
        const blob = await editor.toBlob();
        const fileName = `moldura_${Date.now()}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        if (Utils.isMobile() && Utils.canShareFiles([file])) {
          try {
            await navigator.share({ files: [file], title: 'Minha Foto' });
            this._success(btn, original);
          } catch (err) {
            if (err.name !== 'AbortError') this._fallback(blob, fileName, btn, original);
            else this._reset(btn, original);
          }
        } else {
          this._fallback(blob, fileName, btn, original);
        }
      } catch (err) {
        console.error(err);
        Toast.error('Erro ao processar imagem');
        this._reset(btn, original);
      }
    },

    _fallback(blob, name, btn, original) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this._success(btn, original);
      }, 200);
    },

    _success(btn, original) {
      btn.innerHTML = '✅ Concluído!';
      btn.style.background = 'linear-gradient(135deg, #22C55E, #16A34A)';
      Toast.success('Imagem salva!');
      setTimeout(() => this._reset(btn, original), 2000);
    },

    _reset(btn, original) {
      btn.innerHTML = original;
      btn.style.background = '';
      btn.disabled = false;
    }
  };

  window.Share = Share;
})(window);
