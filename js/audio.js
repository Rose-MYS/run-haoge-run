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
  var CUSTOM_VOICE_KEY = 'haoge_custom_voices_v1';
  var customVoices = {};
  try {
    customVoices = JSON.parse(localStorage.getItem(CUSTOM_VOICE_KEY) || '{}') || {};
  } catch (e) { customVoices = {}; }

  var VOICE_META = [
    { key: 'baoshu', label: '这瓜保熟吗？', trigger: '开局 / 捡保熟卡 / 被抓', file: 'assets/audio/huaqiang-baoshu.mp3', keywords: ['保熟', 'baoshu'], stack: 1 },
    { key: 'zhaocha', label: '我看你是故意找茬', trigger: '随机挑衅台词', file: 'assets/audio/huaqiang-zhaocha.mp3', keywords: ['故意找茬', 'zhaocha'], stack: 1 },
    { key: 'haogeZhaocha', label: '你是故意找茬是不是？', trigger: '劈瓜演出郝哥回应', file: 'assets/audio/haoge-zhaocha.mp3', keywords: ['找茬是不是', 'haoge-zhaocha'], stack: 1 },
    { key: 'pigua', label: '你劈我瓜是吧？', trigger: '华强劈瓜演出', file: 'assets/audio/huaqiang-pigua.mp3', keywords: ['劈瓜', 'pigua'], stack: 1 },
    { key: 'jinxigua', label: '金西瓜！', trigger: '吃到金西瓜（支持连击）', file: 'assets/audio/huaqiang-jinxigua.mp3', keywords: ['金西瓜', 'jinxigua'], stack: 6 },
    { key: 'scream', label: '郝哥惨叫', trigger: '无尽模式被抓捅刀瞬间', file: 'assets/audio/haoge-canjiao.mp3', keywords: ['惨叫', 'canjiao', 'scream'], stack: 1 },
    { key: 'sarilang', label: '萨日朗！', trigger: '撞障 / 路过大妈', file: 'assets/audio/haoge-sarilang.mp3', keywords: ['萨日朗', 'sarilang'], stack: 1 },
    { key: 'ending', label: '结尾原声', trigger: '无尽模式结尾骑车离开', file: 'assets/audio/ending-scene.mp3', keywords: ['结尾', 'ending'], stack: 1 },
    { key: 'shengua', label: '生瓜蛋子！', trigger: '随机台词', file: 'assets/audio/haoge-shengguadanzi.mp3', keywords: ['生瓜', 'shengguadanzi'], stack: 1 },
    { key: 'daxiang', label: '大象叫（大招）', trigger: '释放保熟技能', file: 'assets/audio/haoge-daxiang.mp3', keywords: ['大象', 'daxiang'], stack: 1 },
    { key: 'aihuaqiang', label: '哎华强！', trigger: '路边一家三口（60%）', file: 'assets/audio/bystander-aihuaqiang.mp3', keywords: ['哎华强', 'aihuaqiang'], stack: 1 },
    { key: 'huaqiang', label: '华强！', trigger: '路边一家三口（30%）', file: 'assets/audio/bystander-huaqiang.mp3', keywords: ['bystander-huaqiang'], stack: 1 },
    { key: 'huaihua', label: '华强！哎华强！', trigger: '路边一家三口（10%）', file: 'assets/audio/bystander-huaqiang-aihuaqiang.mp3', keywords: ['huaihua'], stack: 1 },
    { key: 'zhanzhu', label: '站住！别跑！', trigger: '开局镜头切入追逐', file: 'assets/audio/huaqiang-zhaocha.mp3', keywords: ['站住', 'zhanzhu'], stack: 1 },
    { key: 'paobudiao', label: '你跑不掉的！', trigger: '华强逼近红光预警', file: 'assets/audio/huaqiang-baoshu.mp3', keywords: ['跑不掉', 'paobudiao'], stack: 1 },
    { key: 'haogeBaoshu', label: '这瓜保熟，不熟不要钱！', trigger: '绿灯完美转弯确认', file: 'assets/audio/haoge-shengguadanzi.mp3', keywords: ['不要钱', 'haogebaoshu'], stack: 1 },
    { key: 'kuaipao', label: '快跑啊！', trigger: '分段波次提速冲刺', file: 'assets/audio/haoge-sarilang.mp3', keywords: ['快跑', 'kuaipao'], stack: 1 },
    { key: 'victory', label: '逃出去了！保熟！', trigger: '分段过关冲过出口', file: 'assets/audio/huaqiang-jinxigua.mp3', keywords: ['逃出', '过关', 'victory'], stack: 1 },
    { key: 'goldChain6', label: '六连金西瓜！发财了！', trigger: '连续吃到 6 个金西瓜', file: 'assets/audio/huaqiang-jinxigua.mp3', keywords: ['六连', '发财', 'goldchain'], stack: 2 },
  ];

  function saveCustomVoices() {
    try { localStorage.setItem(CUSTOM_VOICE_KEY, JSON.stringify(customVoices)); } catch (e) { return false; }
    return true;
  }

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
    if (window.HAOGE_SOURCE_ONLY && !window.HAOGE_ENABLE_VOICES) return;
    var activeUrl = customVoices[name] || url;
    var els = [];
    var count = stackCount || 1;
    for (var i = 0; i < count; i++) {
      try {
        els.push(makeVoiceEl(activeUrl, name));
      } catch (e) {}
    }
    voiceRegistry[name] = { els: els, stack: !!stackCount, defaultUrl: url };
  }

  function applyVoiceUrl(name, url) {
    var v = voiceRegistry[name];
    if (!v) return;
    var count = v.els.length || 1;
    for (var i = 0; i < v.els.length; i++) stopEl(v.els[i]);
    v.els = [];
    for (var j = 0; j < count; j++) {
      try { v.els.push(makeVoiceEl(url, name)); } catch (e) {}
    }
  }

  function setCustomVoice(name, dataUrl) {
    if (!dataUrl) return false;
    customVoices[name] = dataUrl;
    var saved = saveCustomVoices();
    applyVoiceUrl(name, dataUrl);
    return saved;
  }

  function resetCustomVoice(name) {
    delete customVoices[name];
    saveCustomVoices();
    var v = voiceRegistry[name];
    if (v && v.defaultUrl) applyVoiceUrl(name, v.defaultUrl);
  }

  function resetAllCustomVoices() {
    customVoices = {};
    saveCustomVoices();
    for (var k in voiceRegistry) {
      if (voiceRegistry[k] && voiceRegistry[k].defaultUrl) {
        applyVoiceUrl(k, voiceRegistry[k].defaultUrl);
      }
    }
  }

  function listVoices() {
    var out = [];
    for (var i = 0; i < VOICE_META.length; i++) {
      var m = VOICE_META[i];
      out.push({
        key: m.key, label: m.label, trigger: m.trigger, keywords: m.keywords,
        custom: !!customVoices[m.key],
        ready: !!(voiceRegistry[m.key] && voiceRegistry[m.key].els.length),
      });
    }
    return out;
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
  registerVoice('zhanzhu', 'assets/audio/huaqiang-zhaocha.mp3');
  registerVoice('paobudiao', 'assets/audio/huaqiang-baoshu.mp3');
  registerVoice('haogeBaoshu', 'assets/audio/haoge-shengguadanzi.mp3');
  registerVoice('kuaipao', 'assets/audio/haoge-sarilang.mp3');
  registerVoice('victory', 'assets/audio/huaqiang-jinxigua.mp3');
  registerVoice('goldChain6', 'assets/audio/huaqiang-jinxigua.mp3', 2);

  return {
    ensure: ensure,
    isMuted: function () { return muted; },
    toggle: function () { muted = !muted; return muted; },
    stop: function () { while (activeEls.length) stopEl(activeEls[0]); },
    playVoice: playVoice,
    playVoiceChain: playVoiceChain,
    previewVoice: function (name) { ensure(); playVoice(name); },
    listVoices: listVoices,
    setCustomVoice: setCustomVoice,
    resetCustomVoice: resetCustomVoice,
    resetAllCustomVoices: resetAllCustomVoices,
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
    perfectTurn: function () {
      tone(587.33, 0.09, 'triangle', 0.14);
      setTimeout(function () { tone(880, 0.14, 'triangle', 0.14); }, 65);
    },
    comboTick: function (combo) {
      var step = Math.min(8, Math.max(0, (combo || 1) - 1));
      tone(740 + step * 65, 0.09, 'sine', 0.13);
    },
    waveUp: function () {
      tone(440, 0.10, 'triangle', 0.13);
      setTimeout(function () { tone(554.37, 0.10, 'triangle', 0.13); }, 85);
      setTimeout(function () { tone(659.25, 0.18, 'triangle', 0.15); }, 170);
    },
  };
})();
