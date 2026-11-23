window.StreetFeedback = (function () {
  'use strict';

  var layer = null;
  var speedLines = null;
  var dangerGlow = null;
  var pool = [];
  var MAX_POOL = 12;

  function ensureLayer() {
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'streetFeedbackLayer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    speedLines = document.createElement('div');
    speedLines.id = 'streetSpeedLines';
    speedLines.setAttribute('aria-hidden', 'true');
    document.body.appendChild(speedLines);

    dangerGlow = document.createElement('div');
    dangerGlow.id = 'streetDangerGlow';
    dangerGlow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dangerGlow);

    for (var i = 0; i < MAX_POOL; i++) {
      var el = document.createElement('div');
      el.className = 'sf-pop';
      el.hidden = true;
      layer.appendChild(el);
      pool.push({ el: el, timer: null });
    }
    return layer;
  }

  function pop(text, kind) {
    ensureLayer();
    var slot = null;
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].el.hidden) {
        slot = pool[i];
        break;
      }
    }
    if (!slot) {
      slot = pool[0];
      if (slot.timer) clearTimeout(slot.timer);
    }
    var el = slot.el;
    el.className = 'sf-pop' + (kind ? ' sf-' + kind : '');
    el.textContent = text;
    el.hidden = false;
    el.classList.remove('sf-run');
    void el.offsetWidth;
    el.classList.add('sf-run');
    slot.timer = setTimeout(function () {
      el.hidden = true;
      el.classList.remove('sf-run');
      slot.timer = null;
    }, 880);
  }

  function setSpeedLines(active) {
    ensureLayer();
    speedLines.classList.toggle('active', !!active);
  }

  function setDanger(intensity) {
    ensureLayer();
    var v = Math.max(0, Math.min(1, intensity || 0));
    dangerGlow.style.opacity = v > 0.02 ? (v * 0.85).toFixed(2) : '0';
  }

  function reset() {
    if (!layer) return;
    setSpeedLines(false);
    setDanger(0);
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].timer) clearTimeout(pool[i].timer);
      pool[i].timer = null;
      pool[i].el.hidden = true;
      pool[i].el.classList.remove('sf-run');
    }
  }

  return {
    pop: pop,
    setSpeedLines: setSpeedLines,
    setDanger: setDanger,
    reset: reset,
  };
})();
