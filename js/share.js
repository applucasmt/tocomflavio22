/* =============================================================
   SHARE — salvar / compartilhar imagem
   ============================================================= */
(function(window) {
  'use strict';

  const Share = {
    save: function() {
      const editor = window.Editor;
      const btn = document.getElementById('downloadBtn');
      if (!editor.hasImage() || !btn) return;

      const original = btn.innerHTML;
      btn.innerHTML = '⏳ Processando...';
      btn.disabled = true;

      const self = this;

      editor.toBlob().then(function(blob) {
        const fileName = 'moldura_' + Date.now() + '.png';
        const file = new File([blob], fileName, { type: 'image/png' });

        if (Utils.isMobile() && Utils.canShareFiles([file])) {
          navigator.share({ files: [file], title: 'Minha Foto' })
            .then(function() { self._success(btn, original); })
            .catch(function(err) {
              if (err.name !== 'AbortError') self._fallback(blob, fileName, btn, original);
              else self._reset(btn, original);
            });
        } else {
          self._fallback(blob, fileName, btn, original);
        }
      }).catch(function(err) {
        console.error(err);
        Toast.error('Erro ao processar imagem');
        self._reset(btn, original);
      });
    },

    _fallback: function(blob, name, btn, original) {
      const self = this;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();

      setTimeout(function() {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        self._success(btn, original);
      }, 200);
    },

    _success: function(btn, original) {
      const self = this;
      btn.innerHTML = '✅ Concluído!';
      btn.style.background = 'linear-gradient(135deg, #22C55E, #16A34A)';
      Toast.success('Imagem salva!');
      setTimeout(function() { self._reset(btn, original); }, 2000);
    },

    _reset: function(btn, original) {
      btn.innerHTML = original;
      btn.style.background = '';
      btn.disabled = false;
    }
  };

  window.Share = Share;
})(window);
