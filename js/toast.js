/* =============================================================
   TOAST — notificações
   ============================================================= */
(function(window){
  'use strict';

  const Toast = {
    el: null,
    timer: null,

    init() {
      this.el = document.getElementById('toast');
    },

    /**
     * @param {string} msg
     * @param {'success'|'error'|'info'|''} type
     * @param {number} duration ms
     */
    show(msg, type = '', duration = 3000) {
      if (!this.el) this.init();
      this.el.textContent = msg;
      this.el.className = 'toast show ' + type;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.el.classList.remove('show');
      }, duration);
    },

    success(msg, d) { this.show(msg, 'success', d); },
    error(msg, d)   { this.show(msg, 'error', d); },
    info(msg, d)    { this.show(msg, 'info', d); }
  };

  window.Toast = Toast;
})(window);
