/* =============================================================
   UTILS — funções auxiliares
   ============================================================= */
(function(window) {
  'use strict';

  const Utils = {
    $: function(sel, ctx) {
      return (ctx || document).querySelector(sel);
    },

    $$: function(sel, ctx) {
      return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
    },

    el: function(tag, attrs, children) {
      const e = document.createElement(tag);
      attrs = attrs || {};
      children = children || [];

      Object.keys(attrs).forEach(function(k) {
        const v = attrs[k];
        if (k === 'style' && typeof v === 'object') {
          Object.assign(e.style, v);
        } else if (k.indexOf('on') === 0 && typeof v === 'function') {
          e.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === 'dataset') {
          Object.assign(e.dataset, v);
        } else {
          e.setAttribute(k, v);
        }
      });

      const list = Array.isArray(children) ? children : [children];
      list.forEach(function(c) {
        if (typeof c === 'string') {
          e.appendChild(document.createTextNode(c));
        } else if (c) {
          e.appendChild(c);
        }
      });

      return e;
    },

    dataURLtoBlob: function(dataUrl) {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8 = new Uint8Array(n);
      while (n--) u8[n] = bstr.charCodeAt(n);
      return new Blob([u8], { type: mime });
    },

    blobToImage: function(blob) {
      return new Promise(function(resolve, reject) {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = function() {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = reject;
        img.src = url;
      });
    },

    isMobile: function() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    canShareFiles: function(files) {
      return !!(navigator.canShare && navigator.canShare({ files: files }));
    },

    formatBytes: function(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    debounce: function(fn, wait) {
      wait = wait || 100;
      let t;
      return function() {
        const args = arguments;
        clearTimeout(t);
        t = setTimeout(function() { fn.apply(null, args); }, wait);
      };
    },

    rafThrottle: function(fn) {
      let scheduled = false;
      let lastArgs;
      return function() {
        lastArgs = arguments;
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(function() {
          scheduled = false;
          fn.apply(null, lastArgs);
        });
      };
    },

    touchDistance: function(t1, t2) {
      return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    },

    touchCenter: function(t1, t2) {
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    },

    registerSW: function() {
      if (!('serviceWorker' in navigator)) return;
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

      window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
          .then(function(reg) {
            console.log('[SW] Registrado:', reg.scope);
          })
          .catch(function(err) {
            console.warn('[SW] Falha (ignorado):', err.message);
          });
      });
    }
  };

  window.Utils = Utils;
})(window);
