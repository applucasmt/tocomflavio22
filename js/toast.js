/* =============================================================
   TOAST — notificações
   ============================================================= */
(function(window) {
  'use strict';

  const Toast = {
    el: null,
    timer: null,

    init: function() {
      this.el = document.getElementById('toast');
    },

    show: function(msg, type, duration) {
      type = type || '';
      duration = duration || 3000;
      if (!this.el) this.init();
      if (!this.el) return;

      this.el.textContent = msg;
      this.el.className = 'toast show ' + type;

      const self = this;
      clearTimeout(this.timer);
      this.timer = setTimeout(function() {
        self.el.classList.remove('show');
      }, duration);
    },

    success: function(msg, d) { this.show(msg, 'success', d); },
    error: function(msg, d) { this.show(msg, 'error', d); },
    info: function(msg, d) { this.show(msg, 'info', d); }
  };

  window.Toast = Toast;
})(window);
