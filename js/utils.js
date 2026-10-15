/* ... resto do arquivo igual ... */

    registerSW() {
      if (!('serviceWorker' in navigator)) return;
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('[SW] Registrado:', reg.scope))
          .catch(err => {
            // ✅ FIX: não quebra o app se o SW falhar
            console.warn('[SW] Falha (ignorado):', err.message);
          });
      });
    }

/* ... resto do arquivo igual ... */
