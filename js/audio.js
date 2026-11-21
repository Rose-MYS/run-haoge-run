window.AppAudio = (function () {
  var ctx = null;
  var muted = false;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted || !ctx) return;
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, vol) {
    if (muted || !ctx) return;
    var t = ctx.currentTime;
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(t);
  }

  // 真人录音语音（assets/audio/*.mp3）
  // 规则：不同语音可同时叠播；同一语音复用单条，不自我叠加；金西瓜串可多条叠加
  var voiceRegistry = {};
  var activeEls = [];

  function stopEl(el) {
    try { el.pause(); el.currentTime = 0; } catch (e) {}
    var i = activeEls.indexOf(el);
    if (i >= 0) activeEls.splice(i, 1);
  }

  function makeVoiceEl(src, name) {
    var a = new Audio(src);
    a.preload = 'auto';
    a.__voiceName = name;
    return a;
  }

  function registerVoice(name, url, stackCount) {
    if (window.HAOGE_SOURCE_ONLY) return;
    var els = [];
    var count = stackCount || 1;
    for (var i = 0; i < count; i++) {
      try {
        els.push(makeVoiceEl(url, name));
      } catch (e) {}
    }
    voiceRegistry[name] = { els: els, stack: !!stackCount };
  }

  function playVoice(name) {
    if (muted) return;
    var v = voiceRegistry[name];
    if (!v || !v.els.length) return;
    var el = null;
    if (v.stack) {
      for (var j = 0; j < v.els.length; j++) {
        if (activeEls.indexOf(v.els[j]) < 0) { el = v.els[j]; break; }
      }
      if (!el) {
        el = makeVoiceEl(v.els[0].src, name);
        v.els.push(el);
      }
    } else {
      el = v.els[0];
      stopEl(el);
    }
    try {
      el.currentTime = 0;
      var p = el.play();
      activeEls.push(el);
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
    el.onended = function () { stopEl(el); };
  }

  // 依次播放同一语音多次，模拟“一群华强轮流喊”
  function playVoiceChain(name, count, gap) {
    if (muted) return;
    var v = voiceRegistry[name];
    if (!v || !v.els.length) return;
    count = Math.max(1, Math.floor(count || 1));
    gap = gap || 180;
    var reserved = [];
    var chain = [];
    for (var k = 0; k < count; k++) {
      var e = null;
      for (var j = 0; j < v.els.length; j++) {
        if (reserved.indexOf(v.els[j]) < 0 && activeEls.indexOf(v.els[j]) < 0) {
          e = v.els[j];
          break;
        }
      }
      if (!e) {
        e = makeVoiceEl(v.els[0].src, name);
        v.els.push(e);
      }
      reserved.push(e);
      chain.push({ el: e, delay: k * gap });
    }
    for (var q = 0; q < chain.length; q++) {
      (function (e, delay) {
        setTimeout(function () {
          if (muted) return;
          stopEl(e);
          try {
            e.currentTime = 0;
            var p = e.play();
            activeEls.push(e);
            if (p && p.catch) p.catch(function () {});
          } catch (err) {}
          e.onended = function () { stopEl(e); };
        }, delay);
      })(chain[q].el, chain[q].delay);
    }
  }

  registerVoice('baoshu', 'assets/audio/huaqiang-baoshu.mp3');
  registerVoice('zhaocha', 'assets/audio/huaqiang-zhaocha.mp3');
  registerVoice('haogeZhaocha', 'assets/audio/haoge-zhaocha.mp3');
  registerVoice('pigua', 'assets/audio/huaqiang-pigua.mp3');
  registerVoice('jinxigua', 'assets/audio/huaqiang-jinxigua.mp3', 6);
  registerVoice('scream', 'assets/audio/haoge-canjiao.mp3');
  registerVoice('sarilang', 'assets/audio/haoge-sarilang.mp3');
  registerVoice('ending', 'assets/audio/ending-scene.mp3');
  registerVoice('shengua', 'assets/audio/haoge-shengguadanzi.mp3');
  registerVoice('daxiang', 'assets/audio/haoge-daxiang.mp3');
  registerVoice('aihuaqiang', 'assets/audio/bystander-aihuaqiang.mp3');
  registerVoice('huaqiang', 'assets/audio/bystander-huaqiang.mp3');
  registerVoice('huaihua', 'assets/audio/bystander-huaqiang-aihuaqiang.mp3');

  return {
    ensure: ensure,
    isMuted: function () { return muted; },
    toggle: function () { muted = !muted; return muted; },
    stop: function () { while (activeEls.length) stopEl(activeEls[0]); },
    playVoice: playVoice,
    playVoiceChain: playVoiceChain,
    jump: function () { tone(320, 0.18, 'square', 0.08, 560); },
    doubleJump: function () { tone(420, 0.18, 'square', 0.08, 700); },
    slide: function () { noise(0.2, 0.12); },
    collect: function () {
      tone(880, 0.09, 'sine', 0.14);
      setTimeout(function () { tone(1320, 0.12, 'sine', 0.12); }, 60);
    },
    gold: function () {
      tone(660, 0.09, 'sine', 0.16);
      setTimeout(function () { tone(990, 0.09, 'sine', 0.14); }, 60);
      setTimeout(function () { tone(1320, 0.14, 'sine', 0.12); }, 120);
    },
    hit: function () { tone(120, 0.35, 'sawtooth', 0.2, 50); noise(0.25, 0.18); },
    cert: function () {
      tone(523, 0.15, 'triangle', 0.16);
      setTimeout(function () { tone(659, 0.15, 'triangle', 0.16); }, 130);
      setTimeout(function () { tone(784, 0.2, 'triangle', 0.16); }, 260);
    },
    skill: function () {
      tone(392, 0.12, 'triangle', 0.16);
      setTimeout(function () { tone(523, 0.12, 'triangle', 0.16); }, 110);
      setTimeout(function () { tone(659, 0.12, 'triangle', 0.16); }, 220);
      setTimeout(function () { tone(784, 0.3, 'triangle', 0.18); }, 330);
      setTimeout(function () { tone(1046, 0.42, 'triangle', 0.14); }, 470);
    },
    caught: function () { tone(180, 0.6, 'sawtooth', 0.22, 60); noise(0.5, 0.15); },
    chop: function () {
      noise(0.09, 0.32);
      tone(95, 0.22, 'sine', 0.32, 48);
    },
    impact: function () {
      tone(140, 0.22, 'sawtooth', 0.22, 55);
      noise(0.18, 0.28);
    },
    ui: function () { tone(600, 0.08, 'sine', 0.1, 800); },
  };
})();
