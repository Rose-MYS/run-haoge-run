window.StreetBGM = (function () {
  'use strict';

  var ctx = null;
  var master = null;
  var running = false;
  var paused = false;
  var muted = false;
  var timerId = null;
  var step = 0;
  var wave = 1;
  var tension = 0;
  var nextTime = 0;

  var BASS_NOTES = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];
  var LEAD_NOTES = [440, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25,
                    440, 523.25, 659.25, 0, 783.99, 659.25, 587.33, 523.25];

  function ensureContext() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.14;
        master.connect(ctx.destination);
      } catch (e) {
        return false;
      }
    }
    if (ctx.state === 'suspended' && !paused && !muted) {
      try { ctx.resume(); } catch (e) {}
    }
    return true;
  }

  function currentBpm() {
    var base = wave === 3 ? 134 : (wave === 2 ? 124 : 112);
    return base + Math.round(tension * 18);
  }

  function playNote(freq, dur, type, vol, when) {
    if (!ctx || !master || muted || paused || freq <= 0) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(vol, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  function playKick(when, heavy) {
    if (!ctx || !master || muted || paused) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(heavy ? 125 : 105, when);
    osc.frequency.exponentialRampToValueAtTime(38, when + 0.11);
    gain.gain.setValueAtTime(heavy ? 0.42 : 0.28, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
    osc.connect(gain);
    gain.connect(master);
    osc.start(when);
    osc.stop(when + 0.14);
  }

  function playHat(when, open) {
    if (!ctx || !master || muted || paused) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(open ? 3200 : 4800, when);
    gain.gain.setValueAtTime(0.04 + tension * 0.03, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + (open ? 0.07 : 0.03));
    osc.connect(gain);
    gain.connect(master);
    osc.start(when);
    osc.stop(when + 0.08);
  }

  function schedule() {
    if (!running || paused || muted || !ctx) return;
    var stepDur = 60 / currentBpm() / 2;
    while (nextTime < ctx.currentTime + 0.14) {
      var s = step % 16;
      if (s % 4 === 0 || (tension > 0.55 && s % 2 === 0)) {
        playKick(nextTime, tension > 0.55);
      }
      if (s % 2 === 1 || wave >= 2) {
        playHat(nextTime, s % 4 === 2);
      }
      var bass = BASS_NOTES[s % BASS_NOTES.length];
      playNote(bass, stepDur * 0.85, 'triangle', 0.24, nextTime);

      var lead = LEAD_NOTES[s];
      if (lead > 0 && (wave >= 2 || s % 2 === 0)) {
        playNote(lead, stepDur * 0.72, 'sine', 0.12 + wave * 0.02, nextTime);
      }
      nextTime += stepDur;
      step++;
    }
  }

  function start() {
    if (!ensureContext()) return;
    running = true;
    paused = false;
    nextTime = ctx.currentTime + 0.04;
    if (!timerId) timerId = setInterval(schedule, 45);
  }

  function stop() {
    running = false;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function setPaused(p) {
    paused = !!p;
    if (!ctx) return;
    if (paused) {
      try { if (ctx.state === 'running') ctx.suspend(); } catch (e) {}
    } else if (running && !muted) {
      try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) {}
      nextTime = ctx.currentTime + 0.04;
    }
  }

  function setMuted(m) {
    muted = !!m;
    if (master && ctx) {
      master.gain.setValueAtTime(muted ? 0 : 0.14, ctx.currentTime);
    }
    if (!muted && running && !paused) ensureContext();
  }

  function setWave(w) {
    wave = Math.max(1, Math.min(3, Math.floor(w || 1)));
  }

  function setTension(t) {
    tension = Math.max(0, Math.min(1, t || 0));
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && running) setPaused(true);
      else if (!document.hidden && running && !muted) setPaused(false);
    });
  }

  return {
    start: start,
    stop: stop,
    setPaused: setPaused,
    setMuted: setMuted,
    setWave: setWave,
    setTension: setTension,
  };
})();
