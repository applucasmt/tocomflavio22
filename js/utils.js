/* =============================================================
   UTILS — funções auxiliares
   ============================================================= */
(function(window){
  'use strict';

  const Utils = {
    /** Atalho para querySelector */
    $(sel, ctx = document) { return ctx.querySelector(sel); },

    /** Atalho para querySelectorAll (retorna array) */
    $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; },

    /** Cria elemento com atributos */
    el(tag, attrs = {}, children = []) {
      const e = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else if (k.startsWith('on') && typeof v === 'function') {
          e.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === 'dataset') {
          Object.assign(e.dataset, v);
        } else {
          e.setAttribute(k, v);
        }
      }
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (typeof c === 'string') e.appendChild(document.createTextNode(c));
        else if (c) e.appendChild(c);
      });
      return e;
    },

    /** Converte dataURL para Blob */
    dataURLtoBlob(dataUrl) {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8 = new Uint8Array(n);
      while (n--) u8[n] = bstr.charCodeAt(n);
      return new Blob([u8], { type: mime });
    },

    /** Converte Blob para Image */
    blobToImage(blob) {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = reject;
        img.src = url;
      });
    },

    /** Detecta se é dispositivo móvel */
    isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /** Detecta suporte a Web Share API */
    canShareFiles(files) {
      return !!(navigator.canShare && navigator.canShare({ files }));
    },

    /** Formata bytes */
    formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /** Debounce */
    debounce(fn, wait = 100) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
    },

    /** Throttle via requestAnimationFrame */
    rafThrottle(fn) {
      let scheduled = false;
      let lastArgs;
      return (...args) => {
        lastArgs = args;
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          fn(...lastArgs);
        });
      };
    },

    /** Distância entre dois toques */
    touchDistance(t1, t2) {
      return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    },

    /** Centro entre dois toques */
    touchCenter(t1, t2) {
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    },

    /** Registrar Service Worker */
    registerSW() {
      if (!('serviceWorker' in navigator)) return;
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
          console.warn('[SW] Falha ao registrar:', err);
        });
      });
    }
  };

  window.Utils = Utils;
})(window);
